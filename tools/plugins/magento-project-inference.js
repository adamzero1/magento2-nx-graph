// @ts-check
console.log('ffs');
const path = require('path');
const { createImportSpecifier } = require('typescript');

/**
 * @type {import('@nrwl/devkit').NxPlugin}
 */
module.exports = {
  projectFilePatterns: ['project.json', 'composer.json'],
  registerProjectTargets: file => {
    // packages are not containerized
    console.log('AAAAAA', {file});
    return {
      "magento/module-admin-analytics": {
        "root": "magento2/app/code/Magento/Dhl/",
        "sourceRoot": "magento2/app/code/Magento/Dhl/",
        "projectType": "library",
        "targets": {
          "build": {
            "executor": "@nrwl/workspace:run-commands",
            "options": {
              "commands": [
                {
                  "command": "mkdir -p vendor/ && rsync magento2/app/code/Magento/Dhl/ vendor/magento/module-dhl --exclude Test -r"
                }
              ]
            }
          }
        },
        "implicitDependencies": [
          "php-executor"
        ]
      }
    }
    return {};
    if (!file.includes('apps')) return {};

    const appName = path.dirname(file).match(/apps\/(\w+)\/app/)?.[1];

    if (!appName) return {};

    const ecrRegistry = process.env.ECR_REGISTRY;
    const image = `${ecrRegistry}/co/${appName}`;

    return {
      'docker-build': {
        executor: '@nrwl/workspace:run-commands',
        options: {
          commands: [
            `docker pull ${image}:build || true`,
            `docker build -t ${image}:build -f docker/ts/Dockerfile --cache-from ${image}:build --target build --build-arg BUILDKIT_INLINE_CACHE=1 --build-arg APP=${appName} .`,
            `docker build -t ${appName}:latest -f docker/ts/Dockerfile --cache-from ${image}:build --target production --build-arg BUILDKIT_INLINE_CACHE=1 --build-arg APP=${appName} .`,
            `docker push ${image}:build`,
          ],
          parallel: false,
        },
      },
      'docker-push': {
        executor: '@nrwl/workspace:run-commands',
        options: {
          commands: [
            `docker tag dqs:latest ${image}:$(get-app-hash.sh ${appName})`,
            `docker push ${image}:$(get-app-hash.sh ${appName})`,
          ],
          parallel: false,
        },
      },
    };
  },
};

console.log('fjkdgalskjda');