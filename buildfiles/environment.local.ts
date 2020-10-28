/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
export const environment = {
  production: false,
  ambiente: 'local',
  shibbolethAuthentication: true,
  publicPath: 'http://localhost:4200/',

  appBaseHref: '/cpass',

  beServerPrefix: '',
  beService: '/rest/api/v1',

  shibbolethSSOLogoutURL: '',
  onAppExitURL: '',
  userManualURL: 'http://dev-cpass-pa.nivolapiemonte.it/UserManual/'
};
