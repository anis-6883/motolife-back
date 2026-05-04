import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faker, en } from '@faker-js/faker';
import { Brand } from 'src/common/models/brand.schema';
import { Category } from 'src/common/models/category.schema';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private readonly faker = new Faker({ locale: [en] });
  private readonly PLACEHOLDER_IMAGE =
    'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg';

  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async seed() {
    this.logger.log('Starting seeding process...');

    await this.seedBrands(10);
    await this.seedCategories(5, 3);

    this.logger.log('Seeding complete!');
  }

  private async seedBrands(count: number) {
    this.logger.log(`Seeding ${count} brands...`);
    const brands: any[] = [];
    for (let i = 0; i < count; i++) {
      brands.push({
        name: this.faker.company.name(),
        image: this.PLACEHOLDER_IMAGE,
        status: true,
        softDeleted: false,
      });
    }

    try {
      await this.brandModel.insertMany(brands);
      this.logger.log(`Successfully seeded ${count} brands.`);
    } catch (error) {
      this.logger.error('Error seeding brands:', error);
    }
  }

  private async seedCategories(rootCount: number, subCount: number) {
    this.logger.log(
      `Seeding ${rootCount} root categories with ${subCount} subcategories each...`,
    );

    for (let i = 0; i < rootCount; i++) {
      try {
        const rootCategory = await this.categoryModel.create({
          name: this.faker.commerce.department(),
          image: this.PLACEHOLDER_IMAGE,
          position: i + 1,
          status: true,
          softDeleted: false,
          parent: null as any,
        });

        const subCategories: any[] = [];
        for (let j = 0; j < subCount; j++) {
          subCategories.push({
            name: this.faker.commerce.productName(),
            image: this.PLACEHOLDER_IMAGE,
            position: j + 1,
            status: true,
            softDeleted: false,
            parent: rootCategory._id,
          });
        }
        await this.categoryModel.insertMany(subCategories);
      } catch (error) {
        this.logger.error(`Error seeding category ${i}:`, error);
      }
    }
    this.logger.log(`Successfully seeded categories.`);
  }
}
