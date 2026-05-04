import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  QueryFilter,
  type PaginateModel,
  Types,
  isValidObjectId,
} from 'mongoose';
import { Cart } from '../../../common/models/cart.schema';
import { Product } from '../../../common/models/products.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { CreateCartDto } from './dto/create-cart.dto';
import { UserIdentity } from 'src/common/interfaces/identity.interface';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CouponUsage } from 'src/common/models/coupon-usage.schema';
import { Coupon, CouponType } from 'src/common/models/coupon.schema';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Customer } from 'src/common/models/customers.schema';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { Order } from 'src/common/models/order.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: PaginateModel<Cart>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Coupon.name)
    private readonly couponModel: PaginateModel<Coupon>,
    @InjectModel(CouponUsage.name)
    private readonly couponUsageModel: PaginateModel<CouponUsage>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
    @InjectModel(Order.name)
    private readonly orderModel: PaginateModel<Order>,
  ) {}

  async createCart(user: UserIdentity, dto: CreateCartDto) {
    if (!user.id) {
      throw new BadRequestException(
        'Either userId or guestId must be provided',
      );
    }

    const filter: QueryFilter<Cart> = !user.isGuest
      ? { userId: new Types.ObjectId(user.id) }
      : { guestId: user.id };

    await this.cartModel.findOneAndDelete(filter);

    const cart = new this.cartModel({
      userId: !user.isGuest ? new Types.ObjectId(user.id) : undefined,
      guestId: user.isGuest ? user.id : undefined,
      items: [],
    });

    for (const item of dto.items) {
      const product = item.isCombo
        ? await this.comboProductModel
            .findById(item.comboProductId)
            .select(
              'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity thumbnail',
            )
        : await this.productModel
            .findById(item.productId)
            .select(
              'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity thumbnail',
            );

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      let unitPrice = product.sellingPrice;
      let availableStock = product.stockQuantity || 0;
      let variantSku = item.variantSku || undefined;
      let variation = item.variation || undefined;
      let attributes = item.attributes || [];

      if (!item.isCombo && item.variantSku) {
        const variant = (product as Product).variants?.find(
          (v) => v.sku === item.variantSku,
        );

        if (!variant) {
          throw new NotFoundException(
            `Variant with SKU ${item.variantSku} not found`,
          );
        }

        unitPrice = variant.variantPrice || product.sellingPrice;
        availableStock = variant.stock || 0;
        variantSku = variant.sku;
        variation = variant.variation;
        attributes = variant.attributes;

        if (product.hasDiscount && variant.discountPrice) {
          unitPrice = variant.discountPrice;
        }
      } else {
        if (product.hasDiscount && product.discountPrice) {
          unitPrice = product.discountPrice;
        }
      }

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Sorry, we have ran out of stock for this product!`,
        );
      }

      const existingItemIndex = cart.items.findIndex((cartItem) => {
        if (item.isCombo) {
          return cartItem.comboProduct?.toString() === item.comboProductId;
        }

        const isSameProduct = cartItem.product?.toString() === item.productId;

        if (variantSku) {
          return isSameProduct && cartItem.variantSku === variantSku;
        }

        return isSameProduct;
      });

      if (existingItemIndex > -1) {
        const newQuantity =
          cart.items[existingItemIndex].quantity + item.quantity;

        if (newQuantity > availableStock) {
          throw new BadRequestException(
            `Cannot add ${item.quantity} more items. Only ${availableStock - cart.items[existingItemIndex].quantity} items can be added`,
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].totalPrice = unitPrice * newQuantity;
      } else {
        cart.items.push({
          ...(item.isCombo
            ? { comboProduct: new Types.ObjectId(item.comboProductId) }
            : { product: new Types.ObjectId(item.productId) }),
          productName: product.name,
          seller: product.seller,
          sku: product.sku,
          variation,
          variantSku,
          ...(item.variation ? { variation: item.variation } : {}),
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
          isCombo: item.isCombo,
          attributes: attributes,
          thumbnail: product.thumbnail ?? item?.thumbnail,
        });
      }
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.total = cart.subtotal;

    if (dto?.total && cart && cart?.total !== dto.total) {
      throw new BadRequestException('Cart total does not match');
    }

    await cart.save();

    return apiResponse({
      data: cart,
      message: 'Cart created successfully',
    });
  }

  async addToCart(user: UserIdentity, dto: AddToCartDto) {
    const { id, isGuest } = user;

    if (!id) {
      throw new BadRequestException(
        'Either userId or guestId must be provided',
      );
    }

    const product = dto.isCombo
      ? await this.comboProductModel
          .findById(dto.comboProductId)
          .select(
            'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity',
          )
      : await this.productModel
          .findById(dto.productId)
          .select(
            'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity',
          );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let unitPrice = product.sellingPrice;
    let availableStock = product.stockQuantity || 0;
    let variantSku = dto.variantSku || undefined;
    let variation = dto.variation || undefined;
    let attributes = dto.attributes || [];

    if (!dto.isCombo && dto.variantSku) {
      const variant = (product as Product).variants?.find(
        (v) => v.sku === dto.variantSku,
      );

      if (!variant) {
        throw new NotFoundException(
          `Variant with SKU ${dto.variantSku} not found`,
        );
      }

      unitPrice = variant.variantPrice || product.sellingPrice;
      availableStock = variant.stock || 0;
      variantSku = variant.sku;
      variation = variant.variation;
      attributes = variant.attributes;

      if (product.hasDiscount && variant.discountPrice) {
        unitPrice = variant.discountPrice;
      }
    } else {
      if (product.hasDiscount && product.discountPrice) {
        unitPrice = product.discountPrice;
      }
    }

    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Sorry, we have ran out of stock for this product!`,
      );
    }

    const filter: QueryFilter<Cart> = !isGuest
      ? { userId: new Types.ObjectId(id) }
      : { guestId: id };

    let cart = await this.cartModel.findOne(filter);

    if (!cart) {
      cart = new this.cartModel({
        userId: !isGuest ? new Types.ObjectId(id) : undefined,
        guestId: isGuest ? id : undefined,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex((item) => {
      if (!dto.isCombo) {
        if (item.product?.toString() === dto.productId) {
          if (variantSku) {
            if (item.variantSku === variantSku) {
              return true;
            } else {
              return false;
            }
          }
          return true;
        }
        return false;
      } else {
        if (item.comboProduct?.toString() === dto.comboProductId) {
          return true;
        }
        return false;
      }
    });

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + dto.quantity;

      if (newQuantity > availableStock) {
        throw new BadRequestException(
          `Cannot add ${dto.quantity} more items. Only ${availableStock - cart.items[existingItemIndex].quantity} items can be added`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].totalPrice = unitPrice * newQuantity;
    } else {
      cart.items.push({
        ...(dto.isCombo
          ? { comboProduct: new Types.ObjectId(dto.comboProductId) }
          : { product: new Types.ObjectId(dto.productId) }),
        productName: product.name,
        seller: product.seller,
        sku: product.sku,
        variation,
        variantSku,
        ...(dto.variation ? { variation: dto.variation } : {}),
        quantity: dto.quantity,
        unitPrice,
        totalPrice: unitPrice * dto.quantity,
        isCombo: dto.isCombo,
        attributes: attributes,
        thumbnail: dto?.thumbnail ?? product.thumbnail,
      });
    }
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.total = cart.subtotal;
    await cart.save();

    await cart.populate('items.product', 'name thumbnail images');

    return apiResponse({
      data: cart,
      message: 'Item added to cart successfully',
    });
  }

  async getCart(user: UserIdentity, guestId?: string) {
    const { id: _id, isGuest } = user;

    let id: string | undefined = isValidObjectId(_id) ? _id : guestId;

    if (!id) {
      throw new BadRequestException(
        'Either userId or guestId must be provided',
      );
    }

    const filter: QueryFilter<Cart> = !isGuest
      ? { userId: new Types.ObjectId(id) }
      : { guestId: id };

    const [cart] = await this.cartModel.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'items.seller',
          foreignField: '_id',
          as: 'sellersData',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                'store.storeName': 1,
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productsData',
          pipeline: [
            {
              $project: {
                _id: 1,
                variants: 1,
                sku: 1,
                stockQuantity: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'combo_products',
          localField: 'items.comboProduct',
          foreignField: '_id',
          as: 'comboProductsData',
          pipeline: [
            {
              $project: {
                _id: 1,
                sku: 1,
                stockQuantity: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    seller: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$sellersData',
                            as: 'seller',
                            cond: { $eq: ['$$seller._id', '$$item.seller'] },
                          },
                        },
                        0,
                      ],
                    },
                    stockQuantity: {
                      $cond: {
                        if: {
                          $and: [
                            { $ifNull: ['$$item.comboProduct', false] },
                            { $ne: ['$$item.comboProduct', null] },
                          ],
                        },
                        then: {
                          $let: {
                            vars: {
                              matchedCombo: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$comboProductsData',
                                      as: 'combo',
                                      cond: {
                                        $eq: [
                                          '$$combo._id',
                                          '$$item.comboProduct',
                                        ],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              $ifNull: ['$$matchedCombo.stockQuantity', 0],
                            },
                          },
                        },
                        else: {
                          $let: {
                            vars: {
                              matchedProduct: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$productsData',
                                      as: 'product',
                                      cond: {
                                        $eq: [
                                          '$$product._id',
                                          '$$item.product',
                                        ],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              $cond: {
                                if: {
                                  $and: [
                                    { $ifNull: ['$$item.variantSku', false] },
                                    { $ne: ['$$item.variantSku', ''] },
                                  ],
                                },
                                then: {
                                  $let: {
                                    vars: {
                                      matchedVariant: {
                                        $arrayElemAt: [
                                          {
                                            $filter: {
                                              input: {
                                                $ifNull: [
                                                  '$$matchedProduct.variants',
                                                  [],
                                                ],
                                              },
                                              as: 'variant',
                                              cond: {
                                                $eq: [
                                                  '$$variant.sku',
                                                  '$$item.variantSku',
                                                ],
                                              },
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                    },
                                    in: {
                                      $ifNull: ['$$matchedVariant.stock', 0],
                                    },
                                  },
                                },
                                else: {
                                  $ifNull: [
                                    '$$matchedProduct.stockQuantity',
                                    0,
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: ['sellersData', 'productsData', 'comboProductsData'],
      },
    ]);

    if (!cart) {
      return apiResponse({
        data: {
          items: [],
          subtotal: 0,
          shippingFee: 0,
          tax: 0,
          total: 0,
        },
        message: 'Cart is empty',
      });
    }

    return apiResponse({
      data: cart,
      message: 'Cart fetched successfully',
    });
  }

  async updateCartItem(user: UserIdentity, dto: UpdateCartItemDto) {
    const { id, isGuest } = user;
    if (!id) {
      throw new BadRequestException(
        'Either userId or guestId must be provided',
      );
    }

    const filter: QueryFilter<Cart> = !isGuest
      ? { userId: new Types.ObjectId(id) }
      : { guestId: id };

    const cart = await this.cartModel.findOne(filter);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex((cartItem) => {
      if (dto.isCombo) {
        return cartItem.comboProduct?.toString() === dto.comboProductId;
      }

      const isSameProduct = cartItem.product?.toString() === dto.productId;

      if (dto.variantSku) {
        return isSameProduct && cartItem.variantSku === dto.variantSku;
      }

      return isSameProduct;
    });

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = !dto.isCombo
      ? await this.productModel
          .findById(dto.productId)
          .select('variants stockQuantity')
      : await this.comboProductModel
          .findById(dto.comboProductId)
          .select('stockQuantity');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let availableStock = product.stockQuantity || 0;

    if (!dto.isCombo && dto.variantSku) {
      const variant = (product as Product).variants?.find(
        (v) => v.sku === dto.variantSku,
      );
      if (variant) {
        availableStock = variant.stock || 0;
      }
    }

    if (dto.quantity > availableStock) {
      throw new BadRequestException(
        `Insufficient stock. Only ${availableStock} items available`,
      );
    }

    cart.items[itemIndex].quantity = dto.quantity;
    cart.items[itemIndex].totalPrice =
      cart.items[itemIndex].unitPrice * dto.quantity;

    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.total = cart.subtotal;

    await cart.save();

    await cart.populate('items.product', 'name thumbnail images');

    return apiResponse({
      data: cart,
      message: 'Cart item updated successfully',
    });
  }

  async removeFromCart(user: IActiveUser, dto: RemoveFromCartDto) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(user.sub),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter((item) => {
      if (dto.isCombo) {
        return item.comboProduct?.toString() !== dto.comboProductId;
      }

      const isSameProduct = item.product?.toString() === dto.productId;

      if (isSameProduct) {
        if (dto.variantSku) {
          return item.variantSku !== dto.variantSku;
        }
        return false;
      }
      return true;
    });

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.total = cart.subtotal;

    await cart.save();

    await cart.populate('items.product', 'name thumbnail images');

    return apiResponse({
      data: cart,
      message: 'Item removed from cart successfully',
    });
  }

  async clearCart(user: UserIdentity) {
    const { id, isGuest } = user;
    if (!id) {
      throw new BadRequestException(
        'Either userId or guestId must be provided',
      );
    }

    const filter: QueryFilter<Cart> = !isGuest
      ? { userId: new Types.ObjectId(id) }
      : { guestId: id };

    const cart = await this.cartModel.findOne(filter);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = [];
    await cart.save();

    return apiResponse({
      data: cart,
      message: 'Cart cleared successfully',
    });
  }

  async applyCoupon(user: IActiveUser, dto: ApplyCouponDto) {
    const session = await this.cartModel.db.startSession();
    session.startTransaction();

    try {
      const { code, guestId } = dto;
      const { sub } = user;

      const customer = await this.customerModel.findById(sub).session(session);

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const cart = await this.cartModel
        .findOne({
          userId: new Types.ObjectId(sub),
        })
        .session(session);

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const coupon = await this.couponModel
        .findOne({
          code,
          status: true,
          softDeleted: false,
        })
        .session(session);

      if (!coupon) {
        throw new NotFoundException('Coupon code is not valid');
      }

      if (
        coupon.customers &&
        coupon.customers.length > 0 &&
        !coupon.customers.some((c) => c.equals(new Types.ObjectId(sub)))
      ) {
        throw new BadRequestException('Coupon code is not valid');
      }

      if (
        new Date(coupon.startDate) > new Date() ||
        new Date(coupon.endDate) < new Date()
      ) {
        throw new BadRequestException('Coupon is not valid at this time');
      }

      const couponUsages = await this.couponUsageModel
        .find({
          coupon: coupon._id,
          customer: new Types.ObjectId(sub),
        })
        .session(session);

      if (couponUsages.length >= coupon.limit) {
        throw new BadRequestException('Coupon limit reached');
      }

      if (customer.totalPoints < coupon.pointsRequired) {
        throw new BadRequestException('Insufficient points');
      }

      cart.coupon = coupon._id;

      const calculateDiscountAmount = (basePrice: number): number => {
        if (coupon.discountType === DISCOUNT_TYPE.PERCENTAGE) {
          return Math.floor((coupon.discountValue / 100) * basePrice);
        }
        return coupon.discountValue;
      };

      const usedOnSellers = cart.items
        .map((item) => item.seller)
        .filter((seller) => seller !== undefined);

      await Promise.all(
        usedOnSellers.map(async (sellerId) => {
          const countUsage = await this.couponUsageModel
            .countDocuments({
              coupon: coupon._id,
              sellers: sellerId,
            })
            .session(session);

          if (countUsage >= coupon.sellerThreshold) {
            throw new BadRequestException(
              'Coupon limit reached for some sellers',
            );
          }
        }),
      );

      switch (coupon.type) {
        case CouponType.DISCOUNT_ON_PURCHASE:
          cart.total = cart.subtotal - calculateDiscountAmount(cart.subtotal);
          cart.couponDiscount = calculateDiscountAmount(cart.subtotal);

          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session: session },
          );

          await cart.save();
          break;

        case CouponType.FIRST_ORDER:
          const orderCount = await this.orderModel
            .countDocuments({
              customer: new Types.ObjectId(sub),
            })
            .session(session);

          if (orderCount > 0) {
            throw new BadRequestException(
              'Coupon is only valid for first order',
            );
          }

          cart.total = cart.subtotal - calculateDiscountAmount(cart.subtotal);
          cart.couponDiscount = calculateDiscountAmount(cart.subtotal);

          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session: session },
          );

          await cart.save();
          break;

        case CouponType.FREE_DELIVERY:
          cart.total = cart.subtotal;

          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session: session },
          );

          await cart.save();
          break;

        case CouponType.PRODUCT_BASED:
          const productIds = coupon.products.map((p) => p.toString());
          const sellersIds = coupon.sellers.map((s) => s.toString());

          let discountedAmount = 0;

          cart.items = cart.items.map((item) => {
            if (
              item.product &&
              productIds.includes(item.product.toString()) &&
              (sellersIds.includes(item.seller.toString()) ||
                sellersIds.length === 0)
            ) {
              const newUnitPrice =
                item.unitPrice - calculateDiscountAmount(item.unitPrice);
              const newTotalPrice = newUnitPrice * item.quantity;

              discountedAmount +=
                calculateDiscountAmount(item.unitPrice) * item.quantity;

              return {
                ...item,
                unitPrice: newUnitPrice,
                totalPrice: newTotalPrice,
              };
            } else {
              return item;
            }
          });

          cart.couponDiscount = discountedAmount;
          cart.subtotal = cart.items.reduce(
            (sum, item) => sum + item.totalPrice,
            0,
          );
          cart.total = cart.subtotal;

          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session: session },
          );

          await cart.save();
          break;

        default:
          throw new BadRequestException('Invalid coupon type');
      }

      await session.commitTransaction();

      return apiResponse({
        message: 'Coupon applied successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
