import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from 'transbank-sdk';
import { z } from 'zod';

const WEBPAY_ENV = (process.env.TBK_ENV || 'integration') === 'production' ? 'production' : 'integration';
const TBK_API_KEY_ID = process.env.TBK_API_KEY_ID || '597055555532';
const TBK_API_KEY_SECRET = process.env.TBK_API_KEY_SECRET || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

export const WEBPAY_CONFIG = {
    env: WEBPAY_ENV,
    apiKeyId: TBK_API_KEY_ID,
    apiKeySecret: TBK_API_KEY_SECRET,
    returnUrl: process.env.WEBPAY_RETURN_URL!,
    finalOkUrl: process.env.FINAL_OK_URL || 'https://alimin.easypanel.host/pago-exito',
    finalFailUrl: process.env.FINAL_FAIL_URL || 'https://alimin.easypanel.host/pago-fallo',
};

const getTransaction = () => {
    if (WEBPAY_ENV === 'production') {
        return new WebpayPlus.Transaction(
            new Options(TBK_API_KEY_ID, TBK_API_KEY_SECRET, Environment.Production)
        );
    } else {
        return new WebpayPlus.Transaction(
            new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
        );
    }
};


export const webpayCreate = async (args: {
    buyOrder: string;
    sessionId: string;
    amount: number;
    returnUrl: string;
}) => {
    const tx = getTransaction();
    const response = await tx.create(
        args.buyOrder,
        args.sessionId,
        args.amount,
        args.returnUrl
    );

    return response;
};

export const webpayCommit = async (token: string) => {
    const tx = getTransaction();
    const response = await tx.commit(token);
    return response;
};

