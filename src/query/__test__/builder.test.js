/**
 * Created by pubudud on 9/1/17.
 */

import queryBuilder from '../builder';
import {expect} from 'chai';
import '../../setupTests';

describe('Query Builder', function () {
    it('pushes a middleware to the middleware array and then removes it', function () {
        queryBuilder.use('test', () => '');

        expect(queryBuilder.middleware.length).to.be.gte(1);

        queryBuilder.removeMiddleware('test');

        expect(queryBuilder.middleware.length).to.eq(0);
    });

    it('Uses a middleware which is pushed to the array', function () {

        const FAKE_LIMIT = 10;

        queryBuilder.use('test', ({query, args = []}) => ({query: `${query} LIMIT ?`, args: [...args, FAKE_LIMIT]}));

        const {query, args} = queryBuilder.applyMiddleware({
            query: 'SELECT * FROM ABC',
            test: true
        });

        expect(query).to.equal('SELECT * FROM ABC LIMIT ?');
        expect(args).to.deep.equal([FAKE_LIMIT]);

        queryBuilder.removeMiddleware('test');
    });

    it('returns an error when query is not sent to parseQuery', function () {

        // Case 1: options is not provided
        try {
            queryBuilder.parseQuery({});
        } catch (err) {
            expect(err).not.to.be.undefined;
            expect(err.message).to.match(/query.*undefined/);
        }

        // Case 2: options.query is not provided
        try {
            queryBuilder.parseQuery();
        } catch (err) {
            expect(err).not.to.be.undefined;
            expect(err.message).to.match(/query.*undefined/);
        }

        // Case 3: Before supplying middleware
        let updatedOptions = queryBuilder.parseQuery({
            query: 'SELECT * FROM ABC WHERE ?',
            args: [1]
        });
        expect(updatedOptions.query).to.equal('SELECT * FROM ABC WHERE ?');

        // Case 4: After supplying a middleware
        queryBuilder.use('myMiddleware', ({query, args = []}) => ({query: `${query} LIMIT ?`, args: [...args, 1]}));
        queryBuilder.use('not_to_use', () => ({query: 'Not supposed to be called!!'}));
        updatedOptions = queryBuilder.parseQuery({
            query: 'SELECT * FROM ABC WHERE 1',
            myMiddleware: true
        });
        expect(updatedOptions.query).to.equal('SELECT * FROM ABC WHERE 1 LIMIT ?');
        expect(updatedOptions.args).to.deep.equal([1]);

        // Case 5: Erroneous middleware doesn't return a proper object
        queryBuilder.use('erroneous', () => undefined);
        updatedOptions = queryBuilder.parseQuery({
            query: 'SELECT * FROM ABC WHERE ?',
            args: [1],
            erroneous: true
        });
        expect(updatedOptions.query).to.equal('SELECT * FROM ABC WHERE ?');
        expect(updatedOptions.args).to.deep.equal([1]);

        // after test: Middleware cleanup
        queryBuilder.removeMiddleware('myMiddleware');
        queryBuilder.removeMiddleware('not_to_use');
        queryBuilder.removeMiddleware('not_to_use');
    });
});
