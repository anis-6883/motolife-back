import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';
import { UpdateProductDto } from './update-products.dto';

const collectConstraintMessages = (
  errors: ValidationError[],
): string[] => {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children?.length) {
      messages.push(...collectConstraintMessages(error.children));
    }
  }

  return messages;
};

describe('UpdateProductDto', () => {
  it('rejects empty attribute names inside variants', () => {
    const dto = plainToInstance(UpdateProductDto, {
      variants: [
        {
          variation: 'Red / XL',
          attributes: [
            {
              name: '',
              value: 'Red',
            },
          ],
        },
      ],
    });

    const errors = validateSync(dto);
    const messages = collectConstraintMessages(errors);

    expect(messages).toContain('name should not be empty');
  });

  it('accepts valid variant attributes', () => {
    const dto = plainToInstance(UpdateProductDto, {
      variants: [
        {
          variation: 'Red / XL',
          attributes: [
            {
              name: 'Color',
              value: 'Red',
            },
          ],
        },
      ],
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });
});
