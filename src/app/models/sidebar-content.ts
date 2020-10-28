/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
export interface SidebarContent {
  content: string;
  link: string[];
  icon?: string;
  permission?: string;
  queryParams?: any;
}
