
export function getTermSortOrder(term: string | undefined): number {
    if (!term) return 99;
    const lowerTerm = term.toLowerCase();
    if (lowerTerm.includes('may') || lowerTerm.includes('jun') || lowerTerm.includes('jul') || lowerTerm.includes('apr')) return 1;
    if (lowerTerm.includes('mid')) return 2;
    if (lowerTerm.includes('dec') || lowerTerm.includes('nov') || lowerTerm.includes('jan') || lowerTerm.includes('feb')) return 3;
    return 4; 
}

export function getSemesterSortOrder(semester: string | undefined): number {
    if (!semester) return 99; 

    const romanMap: { [key: string]: number } = { I: 1, V: 5, X: 10 };
    const romanMatch = semester.toUpperCase().match(/^(VIII|VII|VI|V|IV|III|II|I)(\s+SEM)?\b/);

    if (romanMatch && romanMatch[1]) {
        const roman = romanMatch[1];
        let result = 0;
        let prevValue = 0;
        for (let i = roman.length - 1; i >= 0; i--) {
            const currentValue = romanMap[roman[i]];
            if (!currentValue) continue; 

            if (currentValue < prevValue) {
                result -= currentValue;
            } else {
                result += currentValue;
            }
            prevValue = currentValue;
        }
         if (result > 0 && result <= 8) return result;
    }

    return 98;
}

export function getProgrammeSortOrder(programme: string | undefined): number {
    if (!programme) return 99;
    const upperProg = programme.toUpperCase();
    if (upperProg.includes('B.TECH')) return 1;
    if (upperProg.includes('M.TECH')) return 2;
    return 50; 
}
