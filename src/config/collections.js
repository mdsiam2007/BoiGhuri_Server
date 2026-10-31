import { getCollection } from './db.js';

export const getBooksCollection = () => getCollection('books');
export const getBorrowsCollection = () => getCollection('borrows');
export const getReviewsCollection = () => getCollection('reviews');
export const getUsersCollection = () => getCollection('user');

