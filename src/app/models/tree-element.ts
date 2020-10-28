/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Destinatario, RigaOrdine, TestataOrdine, Fornitore } from '../modules/cpassapi';

export type TreeElementSelectionType = 'single' | 'multi' | 'none';

export interface TreeElement<T> {
  id: string;
  isTerminal: boolean;
  children: TreeElement<T>[];
  expanded: boolean;
  $$expanded: boolean;
  shownText: string;
  filterText: string;
  highlighted?: boolean;
  checked?: boolean;
  wrappedElement: T;
  // Force only id and children
  [key: string]: any;
}

export type DestinatarioWithRigaOrdine = Destinatario & {children: RigaOrdine[]};
export type TestataOrdineWithDestinatarioWithRigaOrdine = TestataOrdine & {children: DestinatarioWithRigaOrdine[]};
export type FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine = Fornitore & {children: TestataOrdineWithDestinatarioWithRigaOrdine[]};
