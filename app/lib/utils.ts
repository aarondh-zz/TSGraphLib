export function objectAssign<T>(target: T, ...sources: T[]): T {
    if (sources) {
        sources.forEach((source) => {
            for (let key in source) {
                target[key] = source[key];
            }
        });
    }
    return target;
}
