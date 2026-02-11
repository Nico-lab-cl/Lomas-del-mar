export const isValidRut = (value: string) => {
    const raw = value.replace(/[^0-9kK]/g, '');
    if (raw.length < 2) return false;
    const dv = raw.slice(-1).toUpperCase();
    const body = raw.slice(0, -1);
    if (!/^\d{7,9}$/.test(body)) return false;

    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i -= 1) {
        sum += Number(body[i]) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }
    const mod = 11 - (sum % 11);
    const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
    return dv === expected;
};

export const buildBuyOrder = (lotId: number) => {
    const ts = Date.now().toString();
    const suffix = ts.slice(-10);
    const base = `ALM${lotId}${suffix}`;
    return base.slice(0, 26);
};

export const computeLotDetailsFromId = (lotId: number) => {
    const stageAndStageLotNumber = (() => {
        if (lotId >= 1 && lotId <= 47) return { stage: 1, stageLotNumber: lotId };

        // Stage 2
        if (lotId >= 50 && lotId <= 92) return { stage: 2, stageLotNumber: lotId - 49 };
        if (lotId === 199) return { stage: 2, stageLotNumber: 44 };
        if (lotId === 198) return { stage: 2, stageLotNumber: 45 };
        if (lotId === 197) return { stage: 2, stageLotNumber: 46 };
        if (lotId === 48) return { stage: 2, stageLotNumber: 47 };

        // Stage 3
        if (lotId >= 93 && lotId <= 131) return { stage: 3, stageLotNumber: lotId - 92 };
        if (lotId === 49) return { stage: 3, stageLotNumber: 40 };
        if (lotId === 203) return { stage: 3, stageLotNumber: 41 };
        if (lotId === 202) return { stage: 3, stageLotNumber: 42 };
        if (lotId === 201) return { stage: 3, stageLotNumber: 43 };

        // Stage 4
        if (lotId >= 132 && lotId <= 196) return { stage: 4, stageLotNumber: lotId - 131 };
        return null;
    })();

    const stage = stageAndStageLotNumber?.stage ?? null;
    const stageLotNumber = stageAndStageLotNumber?.stageLotNumber ?? null;

    const area_m2 = (() => {
        if (!stage || !stageLotNumber) return null;

        if (stage === 1) {
            if (stageLotNumber === 1) return 326.23;
            if (stageLotNumber >= 2 && stageLotNumber <= 27) return 200;
            if (stageLotNumber === 28) return 344.2;
            if (stageLotNumber >= 29 && stageLotNumber <= 46) return 390;
            if (stageLotNumber === 47) return 236.97;
            return null;
        }

        if (stage === 2) {
            if (stageLotNumber === 1) return 374.13;
            if (stageLotNumber >= 2 && stageLotNumber <= 27) return 200;
            if (stageLotNumber === 28) return 211.72;
            if (stageLotNumber === 29) return null;
            if (stageLotNumber === 30) return 361.08;
            if (stageLotNumber >= 31 && stageLotNumber <= 46) return 390;
            if (stageLotNumber === 47) return 303.52;
            return null;
        }

        if (stage === 3) {
            if (stageLotNumber >= 1 && stageLotNumber <= 25) return 200;
            if (stageLotNumber === 26 || stageLotNumber === 27) return null;
            if (stageLotNumber >= 28 && stageLotNumber <= 42) return 390;
            if (stageLotNumber === 43) return null;
            return null;
        }

        if (stage === 4) {
            if (stageLotNumber === 1) return 249.24;
            if (stageLotNumber === 2) return 239.18;
            if (stageLotNumber === 3) return 228.91;
            if (stageLotNumber === 4) return 215.63;
            if (stageLotNumber === 5) return 201.33;
            if (stageLotNumber >= 6 && stageLotNumber <= 23) return 200;
            if (stageLotNumber === 24) return 293.3;
            if (stageLotNumber === 25) return 449.28;
            if (stageLotNumber >= 26 && stageLotNumber <= 40) return 200;
            if (stageLotNumber === 41) return null;
            if (stageLotNumber === 42) return 294.07;
            if (stageLotNumber === 43) return 308.84;
            if (stageLotNumber === 44 || stageLotNumber === 45) return null;
            if (stageLotNumber === 46) return 316.56;
            if (stageLotNumber === 47) return 232.04;
            if (stageLotNumber === 48) return 208.79;
            if (stageLotNumber >= 49 && stageLotNumber <= 64) return 390;
            if (stageLotNumber === 65) return null;
            return null;
        }

        return null;
    })();

    const price_total_clp = (() => {
        if (area_m2 != null && area_m2 >= 200 && area_m2 <= 299) return 34900000;
        if (area_m2 != null && area_m2 >= 300 && area_m2 <= 399) return 42900000;
        return null;
    })();

    return {
        number: stageLotNumber ? String(stageLotNumber) : String(lotId),
        stage,
        area_m2,
        price_total_clp,
    };
};
