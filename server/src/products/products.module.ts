import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { CategoriesController } from './categories.controller'
import { ProductsService } from './products.service'
import { CategoriesService } from './categories.service'

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
})
export class ProductsModule {}