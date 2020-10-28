/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

export interface CpassSidebarModule {
  code: string;
  routerUrl: string[];
  urlSubpaths: string[];
  i18n: string;
  isHome?: boolean;
  ignore?: boolean;
}

export const POSSIBLE_SIDEBAR_MODULES: CpassSidebarModule[] = [
  { code: '', routerUrl: ['/home'], urlSubpaths: ['/home'], i18n: marker('SIDEBAR.HOME'), isHome: true },
  { code: 'PBA', routerUrl: ['/pba'], urlSubpaths: ['/pba'], i18n: marker('SIDEBAR.PBA.TITLE') },
  { code: 'ORD', routerUrl: ['/ord'], urlSubpaths: ['/ord'], i18n: marker('SIDEBAR.ORDINI.TITLE') },
  { code: 'MAG', routerUrl: ['/mag'], urlSubpaths: ['/mag'], i18n: marker('SIDEBAR.MAGAZZINI.TITLE'), ignore: true },
  { code: 'RIC', routerUrl: ['/ric'], urlSubpaths: ['/ric'], i18n: marker('SIDEBAR.RICHIESTE.TITLE'), ignore: true }
];
