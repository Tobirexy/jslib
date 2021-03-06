import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class PasswordAgentCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, false);
        if (results == null) {
            result.success = false;
            return result;
        }

        let newVersion = true;
        results.forEach((value) => {
            if (value.length !== 5 && value.length < 9) {
                return;
            }
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value[0], '--');
            cipher.login.username = this.getValueOrDefault(value[1]);
            cipher.login.password = this.getValueOrDefault(value[2]);
            if (value.length === 5) {
                newVersion = false;
                cipher.notes = this.getValueOrDefault(value[4]);
                cipher.login.uris = this.makeUriArray(value[3]);
            } else {
                const folder = this.getValueOrDefault(value[8], '(None)');
                const folderName = folder !== '(None)' ? folder.split('\\').join('/') : null;
                this.processFolder(result, folderName);
                cipher.notes = this.getValueOrDefault(value[3]);
                cipher.login.uris = this.makeUriArray(value[4]);
            }
            this.convertToNoteIfNeeded(cipher);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        if (newVersion && this.organization) {
            this.moveFoldersToCollections(result);
        }

        result.success = true;
        return result;
    }
}
