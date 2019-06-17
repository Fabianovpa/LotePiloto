declare var require: (s: string) => any;

import {Folder, sp} from "@pnp/sp";
import {SPFetchClient} from "@pnp/nodejs";
import {readFile} from 'fs';
import {Gulpclass, SequenceTask, Task} from "gulpclass/Decorators";

var gulp = require("gulp");
var watch = require('gulp-watch');
var replace = require('gulp-string-replace');
var yargs = require('yargs');
var notifier = require("node-notifier");

const settings = require("./config/settings.js");

let env: string = yargs.argv.env || 'development';
let branch: string = yargs.argv.branch || 'main';

interface Settings {
    siteUrl: string,
    clientId: string,
    clientSecret: string
}

class Deployer {
    constructor(private settings: Settings) {
        sp.setup({
            sp: {
                fetchClientFactory: () => {
                    return new SPFetchClient(
                        'https://naturabr.sharepoint.com' + this.settings.siteUrl,
                        this.settings.clientId,
                        this.settings.clientSecret);
                }
            }
        });
    }

    async deploy(branch: string) {
        let deployFolderItem = await sp.web.getFolderByServerRelativePath(this.settings.siteUrl + '/SiteAssets/deploy').getItem();
        let folder: Folder;

        try {
            let usuarioFolderItem = await deployFolderItem.folder.folders.getByName(branch).getItem();
            folder = usuarioFolderItem.folder;
        } catch (e) {
            let result = await deployFolderItem.folder.folders.add(branch);
            folder = result.folder;
        }

        let jsFolder: Folder;

        try {
            let jsFolderItem = await folder.folders.getByName('JS').getItem();
            jsFolder = jsFolderItem.folder;
        } catch (e) {
            let result = await folder.folders.add('JS');
            jsFolder = result.folder;
        }

        readFile('dist/natura.html', function (err, contents) {
            folder.files.add('natura.html', contents, true);
        });

        readFile('dist/agendamentos.html', function (err, contents) {
            folder.files.add('agendamentos.html', contents, true);
        });

        readFile('dist/agendamentos_beta.html', function (err, contents) {
            folder.files.add('agendamentos_beta.html', contents, true);
        });

        readFile('dist/calendar.html', function (err, contents) {
            folder.files.add('calendar.html', contents, true);
        });

        readFile('dist/lotePiloto.js', function (err, contents) {
            jsFolder.files.add('lotePiloto.js', contents, true);
        });

        readFile('dist/agendamentos.js', function (err, contents) {
            jsFolder.files.add('agendamentos.js', contents, true);
        });

        readFile('dist/SPfullcalendar.js', function (err, contents) {
            jsFolder.files.add('SPfullcalendar.js', contents, true);
        });
    }
}

@Gulpclass()
export class Gulpfile {
    @Task("build-js")
    buildJs() {
        if (branch != 'main') {
            return gulp.src('src/JS/*.js')
                .pipe(replace('/Lists/Agendamentos/DispForm.aspx\\?ID=', '/SiteAssets/' + branch + '.aspx?loteid='))
                .pipe(replace('/Lists/Agendamentos/NewForm.aspx', '/SiteAssets/' + branch + '.aspx'))
                .pipe(gulp.dest('dist'));
        }

        return gulp.src('src/JS/*.js')
            .pipe(gulp.dest('dist'));
    }

    @Task("build-html")
    buildHtml() {
        return gulp.src('src/HTML/*.html')
            .pipe(replace('/sites/DEV_LotePiloto/SiteAssets/deploy/main/JS/lotePiloto.js', settings.envs[env].siteUrl + '/SiteAssets/deploy/' + branch + '/JS/lotePiloto.js'))
            .pipe(replace('/sites/DEV_LotePiloto/SiteAssets/deploy/main/JS/agendamentos.js', settings.envs[env].siteUrl + '/SiteAssets/deploy/' + branch + '/JS/agendamentos.js'))
            .pipe(replace('/sites/DEV_LotePiloto/SiteAssets/main.aspx', settings.envs[env].siteUrl + '/SiteAssets/' + branch + '.aspx'))
            .pipe(replace('/sites/DEV_LotePiloto/SiteAssets/main-agendamentos.aspx', settings.envs[env].siteUrl + '/SiteAssets/' + branch + '-agendamentos.aspx'))
            .pipe(replace('/sites/DEV_LotePiloto/SiteAssets/', settings.envs[env].siteUrl + '/SiteAssets/'))
            .pipe(replace('ENV = \'DEVELOPMENT\'', 'ENV = \'' + env.toUpperCase() + '\''))
            .pipe(gulp.dest('dist'));
    }

    @SequenceTask()
    build() {
        console.log('=== Efetuando build para o ambiente [' + env.toUpperCase() + '] na branch [' + branch.toUpperCase() + '] ===');
        return ['build-js', 'build-html'];
    }

    @Task()
    deploy() {
        console.log('=== Efetuando deploy para o ambiente [' + env.toUpperCase() + '] na branch [' + branch.toUpperCase() + '] ===');
        return new Deployer(settings.envs[env]).deploy(branch);
    }

    @Task()
    notify(cb: Function) {
        notifier.notify({
            title: 'Deployer',
            message: 'Deploy Finalizado!',
        });

        cb();
    }

    @Task()
    watch() {
        return watch(['src/HTML/*.html', 'src/JS/*.js'], gulp.series(['build-js', 'build-html'], 'deploy', 'notify'));
    }

    @SequenceTask()
    default() {
        return ['build', 'deploy', 'notify'];
    }
}
