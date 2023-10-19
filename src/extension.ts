import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes, BlockCategory as Category } from 'omni-sockets';
import {
  Document,
  SimpleNodeParser,
  SummaryIndex,
  SummaryRetrieverMode,
  serviceContextFromDefaults,
} from 'llamaindex';

const NS_OMNI = 'llamaindex';

let component = OAIBaseComponent.create(NS_OMNI, 'document-summarizer')
  .fromScratch()
  .set('description', 'Summarizes large documents based on a query using llamaindex.')
  .set('title', 'Document Summarizer')
  .set('category', Category.DOCUMENT_PROCESSING)
  .setMethod('X-CUSTOM')
  .setMeta({
    source: {
      summary: 'Summarizes large documents using llamaindex.',
      authors: ['Mercenaries.ai Team'],
      links: {
        "LlamaindexTS Github": "https://github.com/run-llama/LlamaIndexTS",
      }
    }
  });

component
  .addInput(
    component.createInput('document', 'string')
      .set('title', 'Document')
      .set('description', 'The large document to summarize.')
      .setRequired(true)
      .toOmniIO()
  )
  .addInput(
    component.createInput('query', 'string')
      .set('title', 'Query')
      .set('description', 'The query to extract summary.')
      .setRequired(true)
      .toOmniIO()
  )
  .addOutput(
    component.createOutput('answer', 'string')
      .set('description', 'The summarized content')
      .toOmniIO()
  )
  .setMacro(OmniComponentMacroTypes.EXEC, async (payload: any, ctx: WorkerContext) => {
    const { document, query } = payload;

    const serviceContext = serviceContextFromDefaults({
      nodeParser: new SimpleNodeParser({
        chunkSize: 40,
      }),
    });
    
    const doc = new Document({ text: document, id_: "document" });
    const index = await SummaryIndex.fromDocuments([doc], { serviceContext });
    const queryEngine = index.asQueryEngine({
      retriever: index.asRetriever({ mode: SummaryRetrieverMode.LLM }),
    });
    
    const response = await queryEngine.query(query);
    const answer = response.toString();

    return { answer };
  });

const DocumentSummarizerComponent = component.toJSON();

export default {
    createComponents: () => ({
      blocks: [DocumentSummarizerComponent],
      patches: []
    })
};
