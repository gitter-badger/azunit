import program from "commander";
import * as App from "../azunit-app";
import * as Package from "../../package.json";
import fs from "fs";

const langRegex = /[a-z]{2}\-[A-Z]{2}/; // This is pretty lazy and needs a better solution.
const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

program
    .option('-t, --tenant <tenant>', 'The domain of the tenant')
    .option('-a, --app-id <appId>', 'ID of the application service principal with access to target subscription', guidRegex)
    .option('-k, --app-key <key>', 'Service principal secret')
    .option('-s, --subscription <subscription>', 'The ID of the subscription to test', guidRegex)
    .option('-c, --run-culture [culture]', 'Culture/language code for the run (defaults to en-GB)', langRegex, 'en-GB')
    .option('-n, --run-name [name]', 'A name for the test run', undefined, 'Test run ' + new Date(Date.now()).toLocaleString())
    .option("-x, --silent", "Don't output test results to the command line")
    .option("-p, --parameters [path]", "A file containing JSON data passed to the test runs")
    .option('-X, --output-xml [path]', 'Name of the file to output results to in XML format')
    .option('-J, --output-json [path]', 'Name of the file to output results to in JSON format')
    .option('-H, --output-html [path]', 'Name of the file to output results to in HTML format')
    .option('-M, --output-md [path]', 'Name of the file to output results to in Markdown format')
    .option('-C, --output-csv [path]', 'Name of the file to output results to in CSV format')
    .parse(process.argv);

var filenames = program.args;

if (!filenames.length) {
    console.error('test scripts are required');
    process.exit(1);
}

let settings = new App.AzuAppSettings();

settings.silentMode = program.silent;

settings.outputXmlPath = program.outputXml;
settings.outputJsonPath = program.outputJson;
settings.outputHtmlPath = program.outputHtml;
settings.outputMarkdownPath = program.outputMd;
settings.outputCsvPath = program.outputCsv;

let app = App.createApp(settings, Package.version);

let exceptionHandler = (err: Error) => {
    app.logError(err);
    process.exitCode = 1;
};

app.useServicePrincipal(program.tenant, program.appId, program.appKey)
    .then((principal) => {

        principal.getSubscription(program.subscription)
            .then((subscription) => {

                let fileLoader = (filename: string) => {
                    return new Promise<string>((resolve, reject) => {
                        if (filename) {
                            fs.readFile(filename, "utf8", function (err, data) {
                                if (err) { reject(err); }
                                resolve(data);
                            });
                        }
                        else {
                            resolve("");
                        }
                    });
                };

                subscription.createTestRun(program.runName, filenames, program.parameters, fileLoader)
                    .then((results) => {
                        let success = app.logResults(results);
                        process.exitCode = (success) ? 0 : 1;
                    })
                    .catch(exceptionHandler);
            })
            .catch(exceptionHandler);
    })
    .catch(exceptionHandler);