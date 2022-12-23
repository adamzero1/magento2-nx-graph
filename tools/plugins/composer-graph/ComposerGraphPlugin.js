"use strict";
exports.__esModule = true;
exports.getProjectPath = exports.addComposerPackagesToGraphBuilderFromPath = exports.processProjectGraph = void 0;
var devkit_1 = require("@nrwl/devkit");
var glob = require("glob");
var fs = require("fs");

const ignoredDeps = [
    "php",
    "lib-libxml",
    "magento/magento-composer-installer",
    "magento/composer-dependency-version-audit-plugin",
    "magento/zend-cache",
    "magento/zend-db",
    "magento/zend-pdf",
];

var psrToProjectMap = [];

function processProjectGraph(graph, context) {
    // console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', {
    //     // context,
    //     // graph,
    //     // projects: context.workspace.projects
    // });
    var builder = new devkit_1.ProjectGraphBuilder(graph);



    for(var projectName in context.workspace.projects){
        let projectConfig = context.workspace.projects[projectName];
        processProject(projectName, projectConfig, builder)
    }

    return builder.getUpdatedProjectGraph();
}

var processProject = function(projectName, projectConfig, builder){
    processComposerJson(projectName, projectConfig, builder);
    processDiXml(projectName, projectConfig, builder);
    processPhpSourceCode(projectName, projectConfig, builder);
};

var processComposerJson = function(projectName, projectConfig, builder){
    // console.log('processComposerJson: %s', projectName);
    let composerJsonPath = projectConfig.sourceRoot + '/composer.json';
    if(!fs.existsSync(composerJsonPath)){
        console.log('file doesn\'t exist', {composerJsonPath});
        return;
    }
    let composerJson = JSON.parse(fs.readFileSync(composerJsonPath).toString());
    if(!composerJson.require){
        // no dependencies
        return;
    }

    for(var dependency in composerJson.require){
        // TODO - enable 3rd parts deps
        if (ignoredDeps.includes(dependency) || !dependency.includes('magento')) {
            continue;
        }
        // console.log('builder.addExplicitDependency(%s, %s, %s);', projectName, composerJsonPath, dependency);
        builder.addExplicitDependency(
            projectName,
            composerJsonPath,
            dependency
        );
    }
}

exports.processProjectGraph = processProjectGraph;
var addComposerPackagesToGraphBuilderFromPath = function (builder, path) {
    var composerPackages = glob.sync(path + '**/**/composer.json').map(function (file) { return JSON.parse(fs.readFileSync(file).toString()); });
    for (var _i = 0, composerPackages_1 = composerPackages; _i < composerPackages_1.length; _i++) {
        var composerPackage = composerPackages_1[_i];
        if (!composerPackage.require) {
            //skip if we have no dependencies.
            continue;
        }
        var ignoredDeps = [
            //"magento/framework",
            // "magento/framework-amqp",
            // "magento/framework-message-queue",
            // "magento/framework-bulk",
            "magento/magento-composer-installer"
        ];
        for (var _a = 0, _b = Object.keys(composerPackage.require); _a < _b.length; _a++) {
            var dep = _b[_a];
            if (ignoredDeps.includes(dep)) {
                continue;
            }
            // const packageFiles = glob.sync(path + getProjectPath(composerPackage) + '**/**', { nodir: true}); //This is probably overly "watchy", we could trim out markdown, etc.
            if (dep.includes("magento")) {
                builder.addImplicitDependency(composerPackage.name, dep);
            }
            // for(const file of packageFiles){
            // }
        }
    }
};
exports.addComposerPackagesToGraphBuilderFromPath = addComposerPackagesToGraphBuilderFromPath;
var getProjectPath = function (packageRef) {
    if (packageRef.name.includes("magento")) {
        var path = Object.keys(packageRef === null || packageRef === void 0 ? void 0 : packageRef.autoload["psr-4"])[0].replace("\\", "/").replace("\\", "/");
        return "/" + path;
    }
    return packageRef.name.replace('demo-nx-php', '');
};
exports.getProjectPath = getProjectPath;
