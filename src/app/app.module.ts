/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SidebarModule } from 'ng-sidebar';
import { NgxMaskModule } from 'ngx-mask';
import { AppComponent } from 'src/app/app.component';
import { HomePageComponent, HeaderComponent, FooterComponent, ErrorPageComponent } from 'src/app/components';
import { ApiModule, BASE_PATH } from 'src/app/modules/cpassapi';
import { LOGOUT_URL, USER_MANUAL_URL } from 'src/app/modules/cpasscommon/variables';
import { AppRoutingModule } from 'src/app/app-routing.module';
import {
  ConfigurationService,
  JsonDateInterceptorService,
  TranslationHttpLoaderFactory,
  TranslationAppInitializerFactory,
  LogService,
  SessionStorageService,
  ErrorHandlerInterceptorService, UtilitiesService
} from 'src/app/services';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { SettoreHandlerInterceptorService } from './services/interceptor/settore-handler-interceptor.service';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { SpinnerLoaderInterceptor } from './services/interceptor/spinner-loader-interceptor.service';

registerLocaleData(localeIt);

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    HeaderComponent,
    FooterComponent,
    ErrorPageComponent
  ],
  imports: [
    CommonModule,
    CpasscommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    SidebarModule.forRoot(),
    NgxMaskModule.forRoot(),
    TranslateModule.forRoot({
      loader: { provide: TranslateLoader, useFactory: TranslationHttpLoaderFactory, deps: [HttpClient] }
    }),
    NgxSpinnerModule,
    HttpClientModule,
    ApiModule,
    AppRoutingModule,
  ],
  providers: [
    UtilitiesService,
    { provide: BASE_PATH, useFactory: ConfigurationService.getBERootUrl },
    { provide: LOGOUT_URL, useFactory: ConfigurationService.getSSOLogoutURL },
    { provide: APP_BASE_HREF, useValue: ConfigurationService.getBaseHref() },
    { provide: USER_MANUAL_URL, useValue: ConfigurationService.getUserManualUrl() },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorHandlerInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JsonDateInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SettoreHandlerInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerLoaderInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: TranslationAppInitializerFactory,
      deps: [ TranslateService, LogService, SessionStorageService, Injector ],
      multi: true,
    }
    // , RouteService // Cosi??
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
