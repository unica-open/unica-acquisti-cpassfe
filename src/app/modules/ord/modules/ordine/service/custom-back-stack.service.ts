/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable, EventEmitter } from '@angular/core';

export const customStackOperations = {
    tab: {
        ordine: 'tab_ordine',
        finanziari: 'tab_finanz_assoc',
        dettaglio: 'tab_dettaglio',
        riepilogo: 'tab_riepiologo'
    },
    interactions: {
        ordine: {
            open: 'act_ord_open',
            readMode: 'act_ord_read_mode',
            editMode: 'act_ord_edit_mode',
            save: 'act_ord_save'
        },
        destinatario: {
            open: 'act_dest_open',
            readMode: 'act_dest_read_mode',
            editMode: 'act_dest_edit_mode',
            save: 'act_dest_save',
            createNew: 'act_dest_new'
        },
        riga: {
            open: 'act_riga_open',
            readMode: 'act_riga_read_mode',
            editMode: 'act_riga_edit_mode',
            save: 'act_riga_save',
            createNew: 'act_riga_new'
        },
        impegni: {
            open: 'act_imp_open',
            readMode: 'act_imp_read_mode',
            editMode: 'act_imp_edit_mode',
            save: 'act_imp_save',
            createNew: 'act_imp_new'
        }
    }
}

@Injectable()
export class CustomBackStackService {

    private static stack: string[] = [];

    backInteraction = new EventEmitter<string>();

    /**
     * Aggiunge allo stack custom un'operazione compiuta (scelta dall'oggetto constante customStackOperations)
     * @param operation l'operazione compiuta
     */
    static addStackOperation(operation: string) {
        const last = this.getLastOperation();
        if(last !== operation) {
            this.stack.push(operation);
        }
    }

    /**
     * Gestisce la pressione del tasto indietro (occupandosi di saltare uno o due step in base al contesto).
     * Se eliminando uno step, lo step risultante è quello di apertura del component, viene saltato anche quest'ultimo per forzare la navigazione dei tab.
     * È opportuno tenere traccia delle operazioni di apertura del component per sancire l'inizio di un "sotto-stack" interno all'ultimo sotto-component aperto (ad esempio il form destinatario, 
     * o il form riga, che sono interni al component del dettaglio)
     */
    static onBackNavigation(): string {

        const last = this.getLastOperation();
        let thereIsEdit = false;

        let lastDeleted; 

        if(this.isOpen(last)) {
            lastDeleted = this.stack[this.stack.length - 1];
            this.stack.splice(this.stack.length - 1, 1);

            if(!this.isNew(this.getLastOperation())) {

                if(this.isEdit(this.getLastOperation())) {
                    thereIsEdit = true;
                }
                
                lastDeleted = this.stack[this.stack.length - 1];
                this.stack.splice(this.stack.length - 1, 1);
            } 

        } else {
            if(this.isEdit(this.getLastOperation())) {
                thereIsEdit = true;
            }

            lastDeleted = this.stack[this.stack.length - 1];
            this.stack.splice(this.stack.length - 1, 1);
        }

        // se l'ultima operation nello stack è un "open" ricomincio la pulizia delle operazioni
        if(!thereIsEdit && this.isOpen(this.getLastOperation())){
           this.onBackNavigation();
        }

        if(lastDeleted === customStackOperations.interactions.destinatario.open && this.getLastOperation() === customStackOperations.tab.dettaglio) {
            lastDeleted = this.stack[this.stack.length - 1];
            this.stack.splice(this.stack.length - 1, 1);
        }
        
        return this.getLastOperation();
    }

    /**
     * In caso di aggiornamento, nello stack resterebbe l'operazione di abilitazione della modifica. Premere il tasto back dopo il salvataggio comporterebbe
     * l'applicazione della modalità di consultazione, che però sarebbe già attiva. Per evitare ciò elimino, dopo il salvataggio, la voce "edit" dallo stack.
     * Rimuovo anche l'ultimo create new in quanto assimilabile all'abilitazione della modalità di gestione
     * @param saveOperation l'operazione di save per sapere quale edit rimuovere (se ho abilitato la riga, rimuovo l'abilitazione della riga)
     */
    static removeLastEdit(saveOperation: string) {
        // procedo a ritroso fino a trovare l'ultima abilitazione di modifica dell'oggetto che è appena stato salvato
        if(saveOperation.split('_')[saveOperation.split('_').length - 1] === 'save') {
            const context = saveOperation.split('_')[1];

            for(let y = (this.stack.length - 1); y >= 0; y--) {
                const opArr = this.stack[y].split('_');
                if(opArr[1] === context && (opArr[2] === 'edit' || opArr[2] === 'new')) {
                    this.stack.splice(y, 1);
                    break;
                }
            }
        }
    }

    static getLastOperation() {
        return this.stack[this.stack.length -1];
    }

    private static isOpen(operation: string): boolean {
        const inter = customStackOperations.interactions;
        return operation === inter.destinatario.open || operation === inter.riga.open || operation === inter.impegni.open;
    }

    private static isNew(operation: string): boolean {
        const inter = customStackOperations.interactions;
        return operation === inter.destinatario.createNew || operation === inter.riga.createNew || operation === inter.impegni.createNew;
    }

    private static isEdit(operation: string): boolean {
        const inter = customStackOperations.interactions;
        return operation === inter.destinatario.editMode || operation === inter.riga.editMode || operation === inter.impegni.editMode;
    }

    static emptyStack() {
        this.stack = [];
    }

}