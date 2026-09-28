export class AccountIdProvider {

    private static instance: AccountIdProvider;

    private accountId: string;

    private constructor() {
        this.accountId = '';
    }

    public static getInstance(): AccountIdProvider {
        if (!AccountIdProvider.instance) {
            AccountIdProvider.instance = new AccountIdProvider();
        }

        return AccountIdProvider.instance;
    }

    public getAccountId(): string {
        if (!this.accountId) {
            throw new Error('Account ID is not set');
        }

        return this.accountId;
    }

    public setAccountId(accountId: string): void {
        this.accountId = accountId;
    }

}