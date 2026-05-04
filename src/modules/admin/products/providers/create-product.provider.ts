import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Model,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Product } from 'src/common/models/products.schema';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
import { CreateProductDto } from 'src/common/dtos/products/create-products.dto';
import { Brand } from 'src/common/models/brand.schema';
import { Category } from 'src/common/models/category.schema';
import { Seller } from 'src/common/models/seller.schema';
import { Benefits } from 'src/common/models/benefits.schema';
import { ShopType } from 'src/common/enums/seller.enums';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { StorageService } from 'src/common/storage/storage.service';
import { Temp } from 'src/common/models/temp.schema';
import { StockUnits } from 'src/common/models/stock-units';
import { ActivityService } from '../../activity/activity.service';
import { IActiveUser } from 'src/modules/customer/auth/interfaces/active-user.interface';

@Injectable()
export class CreateProductProvider {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(Brand.name)
    private readonly brandModel: Model<Brand>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
    @InjectModel(Benefits.name)
    private readonly benefitsModel: Model<Benefits>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
    @InjectModel(StockUnits.name)
    private readonly stockUnitsModel: Model<StockUnits>,

    private readonly activityService: ActivityService,
    private readonly storageService: StorageService,
  ) {}

  async create(createProductDto: CreateProductDto, user: IActiveUser) {
    const { brand, category, subCategory, benefit } = createProductDto;

    const imagesToCleanup: string[] = [];
    if (createProductDto.thumbnail)
      imagesToCleanup.push(createProductDto.thumbnail);

    if (createProductDto.images) {
      createProductDto.images.forEach((img) => {
        if (img) imagesToCleanup.push(img);
      });
    }

    if (createProductDto.colorWiseImages) {
      createProductDto.colorWiseImages.forEach((sub) => {
        if (sub.image) imagesToCleanup.push(sub.image);
      });
    }

    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const validationPromises: Promise<void>[] = [];

      if (brand) {
        validationPromises.push(
          this.brandModel.findById(brand).then((doc) => {
            if (!doc) throw new NotFoundException('Brand not found');
          }),
        );
      }
      if (category) {
        validationPromises.push(
          this.categoryModel.findById(category).then((doc) => {
            if (!doc) throw new NotFoundException('Category not found');
          }),
        );
      }
      if (subCategory) {
        validationPromises.push(
          this.categoryModel.findById(subCategory).then((doc) => {
            if (!doc) throw new NotFoundException('Sub category not found');
          }),
        );
      }
      if (benefit) {
        validationPromises.push(
          this.benefitsModel.findById(benefit).then((doc) => {
            if (!doc) throw new NotFoundException('Benefit not found');
          }),
        );
      }

      await Promise.all(validationPromises);

      const sellerExists = await this.sellerModel.findById(user.sub).lean();
      let finalSellerId = sellerExists?._id;

      if (!sellerExists || !finalSellerId) {
        const inhouseSeller = await this.sellerModel
          .findOne({
            shopType: ShopType.INHOUSE,
          })
          .session(session);

        if (!inhouseSeller) {
          throw new NotFoundException('Inhouse seller not found');
        }
        finalSellerId = inhouseSeller._id;
      }

      const productExistsWithSlugOrSku = await this.productModel.findOne({
        $or: [{ slug: createProductDto.slug }, { sku: createProductDto.sku }],
      });

      if (productExistsWithSlugOrSku) {
        createProductDto.slug = `${createProductDto.slug}-${String(Date.now()).slice(-4)}`;
        createProductDto.sku = `${createProductDto.sku}-${String(Date.now()).slice(-4)}`;
      }

      if (createProductDto.stockQuantity < 0) {
        throw new BadRequestException('Stock quantity must be greater than 0');
      }

      if (createProductDto.variants?.length > 0) {
        const totalVariantStocks = createProductDto.variants.reduce(
          (acc, variant) => acc + variant.stock,
          0,
        );

        if (createProductDto.stockQuantity !== totalVariantStocks) {
          throw new BadRequestException(
            'Total variant stocks must be equal to total stocks',
          );
        }
      }

      const [newProduct] = await this.productModel.create(
        [
          {
            ...createProductDto,
            seller: finalSellerId,
            ...(brand && { brand: new Types.ObjectId(createProductDto.brand) }),
            ...(category && {
              category: new Types.ObjectId(createProductDto.category),
            }),
            ...(subCategory && {
              subCategory: new Types.ObjectId(createProductDto.subCategory),
            }),
            ...(benefit && {
              benefit: new Types.ObjectId(createProductDto.benefit),
            }),
            status: PRODUCT_STATUS.APPROVED,
            isDamaged: createProductDto.isDamaged || false,
          },
        ],
        { session },
      );

      await this.sellerModel.updateOne(
        { _id: finalSellerId },
        { $inc: { totalProducts: 1 } },
        { session },
      );

      await this.createStockUnits(
        newProduct,
        session,
        createProductDto.isDamaged || false,
      );

      await this.tempModel.deleteMany(
        { url: { $in: imagesToCleanup } },
        { session },
      );

      await this.activityService.createActivity(
        {
          title: 'Product Added',
          action: ActivityAction.CREATE,
          resourceType: ResourceType.PRODUCT,
          resourceId: newProduct._id,
          user: new Types.ObjectId(user.sub),
          payload: newProduct,
        },
        session,
      );

      await session.commitTransaction();
      return apiResponse({
        message: 'Product created successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      if (imagesToCleanup.length > 0) {
        await Promise.all(
          imagesToCleanup.map((url) =>
            this.storageService.deleteFileByUrl(url),
          ),
        ).catch((s3Err) => console.error('S3 Cleanup Failed:', s3Err));
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async createStockUnits(
    product: Product,
    session: ClientSession,
    isDamaged: boolean = false,
  ): Promise<void> {
    const stockUnits: Partial<StockUnits>[] = [];

    const uniqueBatchSuffix = product._id.toString().slice(-5).toUpperCase();

    const skuCounter: Record<string, number> = {};

    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (!skuCounter[variant.sku]) {
          skuCounter[variant.sku] = 0;
        }

        for (let i = 0; i < variant.stock; i++) {
          skuCounter[variant.sku]++;
          const currentCount = skuCounter[variant.sku];

          stockUnits.push({
            sellerId: product.seller,
            productId: product._id,
            categoryId: product.category,
            parentSku: variant.sku,
            variation: variant.variation,
            sku: `${variant.sku}-${uniqueBatchSuffix}-${String(currentCount).padStart(2, '0')}`,
            sellingPrice: variant.variantPrice,
            isDamaged,
          });
        }
      }
    } else {
      for (let i = 0; i < product.stockQuantity; i++) {
        stockUnits.push({
          sellerId: product.seller,
          productId: product._id,
          categoryId: product.category,
          parentSku: product.sku,
          sku: `${product.sku}-${uniqueBatchSuffix}-${String(i + 1).padStart(2, '0')}`,
          sellingPrice: product.sellingPrice,
          isDamaged,
        });
      }
    }

    if (stockUnits.length > 0) {
      await this.stockUnitsModel.insertMany(stockUnits, { session });
    }
  }
}
