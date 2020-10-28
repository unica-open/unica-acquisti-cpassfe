/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
// import { PromptModalComponent } from '../components';

import { Injectable } from '@angular/core';
import { PromptModalComponent } from '../components';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class PromptModalService {

    constructor(private modalService: NgbModal) {
    }

    openPrompt(pTitle: string, pMessage: string, pYes: string, pNo: string, type: string) {
        const modalRef = this.modalService.open(PromptModalComponent, {size: 'xl', scrollable: true});

        modalRef.componentInstance.title = pTitle;
        modalRef.componentInstance.message = pMessage;
        modalRef.componentInstance.yesLabel = pYes;
        modalRef.componentInstance.noLabel = pNo;
        modalRef.componentInstance.callback = this.callback;
        modalRef.componentInstance.modal = modalRef;
        modalRef.componentInstance.type = type;
        return modalRef.result;
    }

    callback(modal: NgbModalRef, val: boolean) {
        modal.close(val);
    }

}
