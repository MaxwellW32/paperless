export default function shuffleArray<T>(array: T[]): T[] {
    const seenArray = JSON.parse(JSON.stringify(array))

    let currentIndex = seenArray.length
    let randomIndex = 0

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [seenArray[currentIndex], seenArray[randomIndex]] = [
            seenArray[randomIndex], seenArray[currentIndex]];
    }

    return seenArray;
}