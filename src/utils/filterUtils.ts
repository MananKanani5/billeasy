export const getFilterAndSortingOptions = (query: any) => {
    const { author, genre, title, sortBy, sortOrder } = query;

    const validSortFields = ['title', 'author', 'genre', 'createdAt'];
    const orderBy: any = sortBy && validSortFields.includes(sortBy)
        ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' };

    const where: any = { isDeleted: false };

    if (genre) {
        where.genre = {
            equals: genre,
            mode: "insensitive"
        };
    }

    if (author) {
        where.author = {
            equals: author,
            mode: "insensitive"
        };
    }

    if (title) {
        where.title = {
            equals: title,
            mode: "insensitive"
        };
    }

    return { orderBy, where };
}; 