<?php

function findComposerJson($path){
    if(!$path){
        return false;
    }
    $dir = dirname($path);
    if(is_file($dir.'/composer.json')){
        return $dir.'/composer.json';
    }
    return findComposerJson($dir);
}

/** @var $loader \Composer\Autoload\ClassLoader */
$loader = require 'vendor/autoload.php';

$class = ltrim($argv[1], '\\');
$filePath = $loader->findFile($class);

if($filePath === false){
    foreach(get_loaded_extensions() as $extension){
        $reflectedExtension = new \ReflectionExtension($extension);
        if(in_array($class, $reflectedExtension->getClassNames())){
            // TODO - probably need to revisit to propper determine name
            // e.g "Core" should be php
            echo 'ext-'.$extension;
            return;
        }
    }
    echo 'Error: Unable to find file for class: "'.$class.'"';
}
$filePath = realpath($filePath);

$composerJsonPath = findComposerJson($filePath);
if($composerJsonPath === false){
    echo 'Error: Unable to find composer.json for path: "'.$filePath.'"';
}
$composerJson = json_decode(file_get_contents($composerJsonPath), true);
echo $composerJson['name'];