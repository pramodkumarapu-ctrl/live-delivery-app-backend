import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth.module';
import { UserModule } from './user/user.module';
import { StoreService } from './store/store.service';
import { StoreController } from './store/store.controller';
import { StoreModule } from './store/store.module';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { ProductModule } from './product/product.module';
import { CartService } from './cart/cart.service';
import { CartController } from './cart/cart.controller';
import { CartModule } from './cart/cart.module';

import { RiderProfileService } from './riderprofile/riderprofile.service';
import { RiderProfileModule } from './riderprofile/riderprofile.module';
import { RiderProfileController } from './riderprofile/riderprofile.controller';

import { OrdersModule } from './orders/orders.module';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';



@Module({
  imports: [UserModule, AuthModule, StoreModule, ProductModule, CartModule,  RiderProfileModule, OrdersModule,  ],
  controllers: [AppController, StoreController, ProductController, CartController,  RiderProfileController, OrdersController ],
  providers: [AppService, StoreService, ProductService, CartService,  RiderProfileService, RiderProfileService, OrdersService ],
})
export class AppModule {}