/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Directive, TemplateRef } from '@angular/core';

@Directive({selector: 'ng-template[cpassPaginationBody]'})
export class PaginationBodyDirective<T> {
  constructor(
    public templateRef: TemplateRef<{$implicit: T}>
  ) {}
}
