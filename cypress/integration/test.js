describe('Loads index', function() {
    it('Should return a webpage', function() {
        cy.visit('/');
        cy.get('h1').should('contain', 'Heroku-Mondrian API');
        cy.get('h2').should('have.length', 3);
        cy.contains('Resource URL:').should('exist');
        cy.contains('Parameters').should('exist');
        cy.contains('Examples').should('exist');

        for (let word of ['width', 'height', 'levels', 'wRatio', 'hRatio', 'discardRatio', 'ext']) {
            cy.contains(word).should('exist');
        }

        cy.get('table').should('exist');
        cy.get('tr').should('have.length', 8);
        cy.get('img').should('have.length', 2).and((img) => {
            expect(img[0].naturalWidth).to.equal(200);
            expect(img[0].naturalHeight).to.equal(300);
            expect(img[1].naturalWidth).to.equal(800);
            expect(img[1].naturalHeight).to.equal(300);
        });
    });
});

describe('Testing image formats', function() {
    for (let extension of ['jpg', 'png', 'webp']) {
        it(`${extension}`, function() {
            cy.request(`/api/200/200/1/0.45/0.45/true.${extension}`).then(response => {
                expect(response.status).to.eq(200);
                expect(response.body.length).to.be.greaterThan(0);
                expect(response.headers['content-type']).to.eq(`image/${extension}`);
            });
        });
    }
});
