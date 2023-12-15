export function yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
}
export function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
export function hoursAgo(hours) {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
}
