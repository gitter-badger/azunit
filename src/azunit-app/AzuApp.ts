import * as Azure from "../azunit-azure";
import * as I18n from "../azunit-i18n";
import * as Logging from "../azunit-results-logging";
import * as Writers from "../azunit-results-writers";

import { IAzuApp } from "./IAzuApp";
import { IAzuPrincipal } from "./IAzuPrincipal";
import { AzuPrincipal } from "./AzuPrincipal";
import { IAzuRunResult } from "../azunit-results";
import { AzuState } from "../azunit";

export class AzuApp implements IAzuApp {

    constructor(version: string, log: Logging.IAzuLog, writer: Writers.IAzuResultsWriter, authenticator: Azure.IAzureAuthenticator, resourceProvider: Azure.IAzureResourceProvider) {
        this.version = version;
        this._log = log;
        this._writer = writer;
        this._authenticator = authenticator;
        this._resourceProvider = resourceProvider;
        
    }

    public readonly version: string;
    private readonly _log: Logging.IAzuLog;
    private readonly _writer: Writers.IAzuResultsWriter;
    private readonly _authenticator: Azure.IAzureAuthenticator;
    private readonly _resourceProvider: Azure.IAzureResourceProvider;

    useServicePrincipal(tenant: string, appId: string, secret: string) {
        
        this._log.write(I18n.Resources.title(this.version));

        return new Promise<IAzuPrincipal>(

            (resolve, reject) => {

                this._log.write(I18n.Resources.statusTenant(tenant));

                this._authenticator.getSPTokenCredentials(tenant, appId, secret)
                    .then((token) => {
                        resolve(new AzuPrincipal(token, this._log, this._resourceProvider));
                    });
            }
        );
    }
    
    logResults(results: Array<IAzuRunResult>): number {
        let success = true;
        let totalTests = 0;
        let totalFailures = 0;
        let totalTime = 0;

        if (results) {
            results.forEach(result => {
                if (result) {
                    success = (success && (result.getState() != AzuState.Failed));
                    this._writer.write(result);
                    totalTests += result.getTestCount();
                    totalFailures += result.getTestFailureCount();
                    totalTime += result.getDurationSeconds();
                }
            });
        }

        if (!success) {
            this._log.write(I18n.Resources.endRunFailed(totalTests, totalFailures, totalTime));
        }
        else {
            this._log.write(I18n.Resources.endRunPassed(totalTests, totalTime));
        }

        this._log.write(I18n.Resources.completed());

        return (success) ? 0: 1;
    }

    logError(err: Error): void {
        this._log.error(err);
    }
}