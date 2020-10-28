/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
export * from './common.service';
import { CommonService } from './common.service';
export * from './common.serviceInterface'
export * from './decodifica.service';
import { DecodificaService } from './decodifica.service';
export * from './decodifica.serviceInterface'
export * from './elaborazione.service';
import { ElaborazioneService } from './elaborazione.service';
export * from './elaborazione.serviceInterface'
export * from './evasione.service';
import { EvasioneService } from './evasione.service';
export * from './evasione.serviceInterface'
export * from './impegno.service';
import { ImpegnoService } from './impegno.service';
export * from './impegno.serviceInterface'
export * from './intervento.service';
import { InterventoService } from './intervento.service';
export * from './intervento.serviceInterface'
export * from './programma.service';
import { ProgrammaService } from './programma.service';
export * from './programma.serviceInterface'
export * from './stampa.service';
import { StampaService } from './stampa.service';
export * from './stampa.serviceInterface'
export * from './system.service';
import { SystemService } from './system.service';
export * from './system.serviceInterface'
export * from './testataOrdine.service';
import { TestataOrdineService } from './testataOrdine.service';
export * from './testataOrdine.serviceInterface'
export * from './utente.service';
import { UtenteService } from './utente.service';
export * from './utente.serviceInterface'
export const APIS = [CommonService, DecodificaService, ElaborazioneService, EvasioneService, ImpegnoService, InterventoService, ProgrammaService, StampaService, SystemService, TestataOrdineService, UtenteService];
