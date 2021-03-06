/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { OnInit, Component, ViewChild, Input, Output } from '@angular/core';
@Component({
    selector: 'cpass-prompt-modal',
    templateUrl: './prompt-modal.component.html',
    styleUrls: ['./prompt-modal.component.css']
})
export class PromptModalComponent {

    @Input() title: string;
    @Input() message: string;
    @Input() yesLabel: string;
    @Input() noLabel: string;
    @Input() callback;
    @Input() modal;
    @Input() type: string;

    constructor() {}

}
