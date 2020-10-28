/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

const inceptionYear = 2019;
const currentYear = new Date().getFullYear();
const params = {
  organizationName: 'CSI Piemonte',
  years: inceptionYear === currentYear ? `${inceptionYear}` : `${inceptionYear} - ${currentYear}`,
};

const banner = fs.readFileSync(path.join(__dirname, 'license.header.txt'), {encoding: 'utf-8'});

module.exports = {
  plugins: [
    new webpack.BannerPlugin({
      banner: banner.replace(/\${(.*?)}/g, (ignored, group) => params[group] || ''),
      entryOnly: false
    })
  ]
};
