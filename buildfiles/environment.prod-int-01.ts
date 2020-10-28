/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
export const environment = {
  production: true,
  ambiente: 'prod-int-01',
  shibbolethAuthentication: true,
  publicPath: 'http://cpass.nivolapiemonte.it',

  appBaseHref: '/cpass',

  beServerPrefix: '',
  beService: '/rest/api/v1',

  shibbolethSSOLogoutURL: 'http://cpass.nivolapiemonte.it/%%SHIB%%/Shibboleth.sso/Logout',
  onAppExitURL: '',
  userManualURL: 'http://cpass.nivolapiemonte.it/UserManual/'
};
