/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
export const environment = {
  production: false,
  ambiente: 'test-int-01',
  shibbolethAuthentication: true,
  publicPath: '//tst-cpass-pa.nivolapiemonte.it',

  appBaseHref: '/cpass',

  beServerPrefix: '',
  beService: '/rest/api/v1',

  shibbolethSSOLogoutURL: 'http://tst-cpass-pa.nivolapiemonte.it/%%SHIB%%/Shibboleth.sso/Logout',
  onAppExitURL: '',
  userManualURL: 'http://tst-cpass-pa.nivolapiemonte.it/UserManual/'
};
