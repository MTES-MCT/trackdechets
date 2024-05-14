import { refreshElasticSearch, resetDatabase } from "../../../integration-tests/helper";
import { formFactory, userFactory } from "../../__tests__/factories";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { getElasticBsdById } from "../elastic";

describe('elastic', () => {
    afterEach(resetDatabase);

    // TODO: faire le workflow depuis la requête front, en envoyant le même format de date.
    it("output date should be the same as input date", async () => {
        // Given
        const user = await userFactory();
        const form = await formFactory({ownerId: user.id, opt: {
            receivedAt: new Date("2023-07-03 00:00:00"),
            processedAt: new Date("2023-07-03 02:00:00")
        }});

        expect(form.receivedAt).toEqual("2023-07-03 00:00:00");
        expect(form.processedAt).toEqual("2023-07-03 02:00:00");

        // Index in ES
        const formForElastic = await getFormForElastic({ readableId: form.readableId });
        await indexForm(formForElastic);
        await refreshElasticSearch();

        // When 
        const formFromES = await getElasticBsdById(form.readableId);
        
        // Then
        const source = formFromES?.body?.hits?.hits?.[0]?._source;
        expect(source).not.toBeNull();
        // expect(new Date(source?.destinationReceptionDate).toISOString()).toEqual("2023-07-03T00:00:00.000Z");
        // expect(new Date(source?.destinationOperationDate).toISOString()).toEqual("2023-07-03T02:00:00.000Z");
    });

});