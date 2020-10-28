/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { ApiError } from 'src/app/modules/cpassapi';

// Transversal utilities
export class Utils {

  private static readonly ISO_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:\+\d{4})?Z?$/;

  static async wait(ms: number = 50): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  static generateRandomString(length: number = 40) {
    const arr = new Uint8Array(length / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, Utils.dec2hex).join('');
  }

  static dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  static clone<T>(obj: T): T {
    const str = JSON.stringify(obj);
    return Utils.jsonParse(str) as T;
  }

  static jsonParse(str: string): any {
    const tmp = JSON.parse(str);
    Utils.convertHandlingDate(tmp);
    return tmp;
  }

  static convertHandlingDate(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj !== 'object') {
      return obj;
    }
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (Utils.isIsoDateString(value)) {
        obj[key] = new Date(value);
      } else if (typeof value === 'object') {
        Utils.convertHandlingDate(value);
      }
    }
  }

  static isIsoDateString(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return Utils.ISO_DATE_FORMAT.test(value);
    }
    return false;
  }

  static extractFileNameFromContentDisposition(contentDisposition: string): string {
    return contentDisposition.substring(contentDisposition.indexOf('filename=') + 9, contentDisposition.length);
  }

  static strToNumber(value: number | string): number {
    // Convert strings to numbers
    if (typeof value === 'string' && !isNaN(Number(value) - parseFloat(value))) {
      return Number(value);
    }
    if (typeof value !== 'number') {
      throw new Error(`${value} is not a number`);
    }
    return value;
  }

  static areApiErrorLike(obj: any[]): obj is ApiError[] {
    return obj.every(el => Utils.isApiErrorLike(el));
  }

  static isApiErrorLike(obj: any): obj is ApiError {
    return obj.code && obj.params;
  }

  static compareById(a: any, b: any) {
    return a && a.id !== null && a.id !== undefined
      && b && b.id !== null && b.id !== undefined
      // tslint:disable-next-line: triple-equals
      && a.id == b.id;
  }
  static groupBy<T>(arr: T[], key: string): {[key: string]: T[]} {
    return arr.reduce((acc, el) => {
      (acc[el[key] || ''] = acc[el[key] || ''] || []).push(el);
      return acc;
    }, {});
  }
}
