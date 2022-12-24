"use strict";
exports.__esModule = true;
exports.getProjectPath = exports.addComposerPackagesToGraphBuilderFromPath = exports.processProjectGraph = void 0;
const devkit_1 = require("@nrwl/devkit");
const glob = require("glob");
const fs = require("fs");
const { execSync } = require('child_process');


function processProjectGraph(graph, context) {
    // console.log('processProjectGraph', {
    //     context,
    //     graph,
    //     projects: context.workspace.projects
    // });
    var builder = new devkit_1.ProjectGraphBuilder(graph);

    for(var projectName in context.workspace.projects){
        let projectConfig = context.workspace.projects[projectName];
        processComposerJson(projectName, projectConfig, builder, graph, context);
        processProjectFiles(projectName, projectConfig, builder, graph, context);
    }

    return builder.getUpdatedProjectGraph();
}

function addNode(name, builder, graph){
    if(graph.nodes[name] === undefined){
        let type = 'unknown';
        switch(true){
            case name == 'php':
                type = 'php';
                break;
            case name.startsWith('ext-') || (name.startsWith('php-') && !name.includes('/')):
                type = 'php-extension';
                break;
            default:
                type = 'external-module'
        }
        builder.addNode({
            name,
            type,
            data: {
                files: []
            }
        });
    }
}

function processComposerJson(projectName, projectConfig, builder, graph, context){
    
    let composerJsonPath = projectConfig.root + 'composer.json';
    let composerJson = JSON.parse(fs.readFileSync(composerJsonPath).toString());
    if(!composerJson.require){
        // no dependencies
        return;
    }

    for(var dependency in composerJson.require){
        addNode(dependency, builder, graph);

        builder.addExplicitDependency(
            projectName,
            composerJsonPath,
            dependency
        );
    }
}

function processProjectFiles(projectName, projectConfig, builder, graph, context){

    // console.log(projectConfig);
    // console.log(graph.nodes[projectName]);

    graph.nodes[projectName].data.files.forEach(file => {
        // file: {
        //     file: 'app/code/Magento/AdminAnalytics/Controller/Adminhtml/Config/EnableAdminUsage.php',
        //     hash: 'f70dd57aa59d67002e4e43b65eaba912baea5348'
        //   }
        console.log('file: %s', file.file);

        let command = null;
        if(file.file.endsWith('.php') || file.file.endsWith('.phtml')){
            command = 'php8.0 ./dev/tools/nx/php-classes.phar ' + file.file;
        }else if(file.file.endsWith('/di.xml')){
            command = 'php8.0 ./dev/tools/nx/php-classes.phar --di.xml ' + file.file;
        }

        if(command){
            // php8.0 ./dev/tools/nx/php-classes.phar app/code/Magento/AdminAnalytics/ViewModel/Notification.php
            console.log('command: %s', command);
            var response = execSync(command).toString();
            response.split(/\r?\n/).forEach(className => {
                if(className){
                    console.log('className: %s', className);
                    
                    // php dev/tools/nx/determine_module_for_class.php '\DOMElement'
                    var moduleResponse = execSync('php dev/tools/nx/determine_module_for_class.php \'' + className + '\'').toString();
                    console.log(moduleResponse);
                    // it's okay if this errors, it might be because a generated class is required
                    // e.g Magento\AdminAnalytics\Model\Viewer\LogFactory
                    // though may need to review again
                    if(!moduleResponse.startsWith('Error:')){
                        addNode(moduleResponse, builder, graph);

                        builder.addExplicitDependency(
                            projectName,
                            file.file,
                            moduleResponse
                        );
                    }
                }
            })
        }
    });
}
exports.processProjectGraph = processProjectGraph;
