/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { TreeElement, FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine, TestataOrdineWithDestinatarioWithRigaOrdine, DestinatarioWithRigaOrdine } from '../tree-element';
import { Cpv, Settore, RigaOrdine } from '../../modules/cpassapi';

export class TreeElementUtils {

  public static cpvToTreeElement(cpvs: Cpv[]): TreeElement<Cpv>[] {
    return TreeElementUtils.translateList(cpvs, ['codice', 'descrizione'], 'listCpv',
      cpv => (cpv.codice + ' ' + cpv.descrizione).toLowerCase(),
      cpv => cpv.codice + ' ' + cpv.descrizione,
      arr => TreeElementUtils.cpvToTreeElement(arr));
  }

  public static settoriToTreeElement(settori: Settore[]): TreeElement<Settore>[] {
    return TreeElementUtils.translateList(settori, ['codice', 'descrizione', 'indirizzo', 'numCivico',
      'email', 'contatto', 'localita', 'provincia', 'cap', 'telefono'], 'listSettore',
      settore => (settore.codice + ' ' + settore.descrizione).toLowerCase(),
      settore => settore.codice + ' ' + settore.descrizione,
      arr => TreeElementUtils.settoriToTreeElement(arr));
  }

  public static fornitoreToTreeElement(fornitori: FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine[]): TreeElement<IdObject>[] {
    return TreeElementUtils.translateList(fornitori as IdObject[], [], 'children',
      fornitore => '',
      (fornitore: FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine) => ('FORNITORE ' + fornitore.codice + ' ' + fornitore.ragioneSociale + ' (P.IVA ' + fornitore.partitaIva + ')'),
      (arr: TestataOrdineWithDestinatarioWithRigaOrdine[]) => TreeElementUtils.ordineToTreeElement(arr));
  }

  public static ordineToTreeElement(ordini: TestataOrdineWithDestinatarioWithRigaOrdine[]): TreeElement<IdObject>[] {
    return TreeElementUtils.translateList(ordini as IdObject[], [], 'children',
    ordine => '',
    (ordine: TestataOrdineWithDestinatarioWithRigaOrdine) => ordine.anno + '/ ' + ordine.numero + ' ' + ordine.descrizione,
    (arr: DestinatarioWithRigaOrdine[]) => TreeElementUtils.destinatarioToTreeElement(arr));
  }
  public static destinatarioToTreeElement(destinatari: DestinatarioWithRigaOrdine[]): TreeElement<IdObject>[] {
    return TreeElementUtils.translateList(destinatari as IdObject[], [], 'children',
      () => '',
      (destinatario: DestinatarioWithRigaOrdine, idx) => `${idx + 1} - ${destinatario.settore.codice} - ${destinatario.settore.descrizione}`,
      (arr: RigaOrdine[]) => arr.map((el, i) => ({
        id: el.id,
        isTerminal: true,
        expanded: false,
        $$expanded: false,
        highlighted: false,
        filterText: el.ods.cpv.codice + ' ' + el.ods.codice + ' ' + el.ods.descrizione,
        shownText: (i + 1) + ' - (CPV ' + el.ods.cpv.codice + ') ' + el.ods.codice + ' - ' + el.ods.descrizione + ' Da evadere=€ ' + el.importoDaEvadere,
        wrappedElement: el,
        children: []
      })));
  }

  private static translateList<T extends {id?: any}>(
      sourceList: T[],
      fieldsToCopy: string[] = [],
      childrenProperty: string = 'children',
      filterGenerator: (item: T, idx: number) => string = () => '',
      shownTextGenerator: (item: T, idx: number) => string = () => '',
      childGenerator: (arr: T[]) => TreeElement<T>[],
      resultList: TreeElement<T>[] = [],
      ): TreeElement<T>[] {
    let idx = 0;
    for (const sourceElement of sourceList) {
      const treeElement: TreeElement<T> = {
        id: sourceElement.id,
        isTerminal: true,
        expanded: false,
        $$expanded: false,
        highlighted: false,
        shownText: shownTextGenerator(sourceElement, idx),
        filterText: filterGenerator(sourceElement, idx),
        wrappedElement: sourceElement,
        children: []
      };
      fieldsToCopy.forEach(field => treeElement[field] = sourceElement[field]);
      resultList.push(treeElement);
      if (sourceElement[childrenProperty] && sourceElement[childrenProperty].length) {
        treeElement.children = childGenerator(sourceElement[childrenProperty]);
        // TreeElementUtils.translateList(sourceElement[childrenProperty], fieldsToCopy, childrenProperty, filterGenerator, treeElement.children);
        treeElement.isTerminal = false;
      }
      idx++;
    }
    return resultList;
  }
  public static getElementById<T>(id: number, list: TreeElement<T>[]): T {
    for (const el of list) {
      if (+el.id === +id) {
        return el.wrappedElement;
      }
      if (el.children && el.children.length) {
        const child = this.getElementById(id, el.children);
        if (child) {
          return child;
        }
      }
    }
    return null;
  }

  public static getElementByFilterText<T>(text: string, list: TreeElement<T>[]): TreeElement<T>[] {
    const resultList: TreeElement<T>[] = [];
    for (const el of list) {
      if (el.children && el.children.length) {
        const child: TreeElement<T>[]  = this.getElementByFilterText(text, el.children);
        if (child) {
          resultList.push(...child);
        }
      }
      const inElement = el.filterText.indexOf(text) !== -1;
      if (inElement) {
        // non è necessario appiattire l'albero
        // resultList.push(TreeElementUtils.linearize(el));
        resultList.push(el);
      }
    }
    return resultList;
  }
  static linearize(el) {
    const res = {...el};
    delete res.children;
    return res;
  }

  // public static getElemenyByFilterText<T>(text: string, list: TreeElement<T>[]): TreeElement<T>[] {
  //   const resultList: TreeElement<T>[] = [];
  //   for (const el of list) {
  //     if (el.children && el.children.length) {
  //       const child: TreeElement<T>[]  = this.getElemenyByFilterText(text, el.children);
  //       // if (child) {
  //       //   resultList.concat(child);
  //       // }
  //     }
  //     const inElement = el.filterText.indexOf(text) !== -1;
  //     if (inElement) {
  //       console.log('pippo');
  //       resultList.push(el);
  //     }
  //   }
  //   if (resultList && resultList.length>0) {
  //     console.log('ricerca soddisfatta ', resultList);
  //   }
  //   return resultList;
  // }
}
