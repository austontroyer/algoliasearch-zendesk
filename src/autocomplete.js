/* global I18n */

import $ from 'jquery';
import algoliasearch from 'algoliasearch';
import templates from './templates.js';
import 'autocomplete.js/index_jquery.js';

export default (options) => {
  let $query = $(options.autocomplete.inputSelector || '#query');

  options.autocomplete.sections = options.autocomplete.sections || {};
  if (options.autocomplete.sections.enabled === undefined) {
    options.autocomplete.sections.enabled = true;
  }
  options.autocomplete.articles = options.autocomplete.articles || {};
  if (options.autocomplete.articles.enabled === undefined) {
    options.autocomplete.articles.enabled = true;
  }

  function adapter(index, params) {
    params = $.extend({facetFilters: `["locale.locale:${I18n.locale}"]`}, params);
    return $.fn.autocomplete.sources.hits(index, params);
  }

  function articleLocale(nbArticles) {
    return options.translations[`article${nbArticles <= 1 ? '' : 's'}`].toLowerCase();
  }

  function header(text) {
    return (
      `<div class="aa-header" style="background-color: ${options.colors.primary}">
        ${text}
      </div>`
    );
  }

  // initialize API client
  let client = algoliasearch(options.applicationId, options.apiKey);

  // initialize indices
  let articles = client.initIndex(`${options.indexPrefix}${options.subdomain}_articles`);
  let sections = client.initIndex(`${options.indexPrefix}${options.subdomain}_sections`);

  let sources = [];
  if (options.autocomplete.sections.enabled) {
    sources.push({
      source: adapter(sections, {hitsPerPage: (options.autocomplete.hits || 3)}),
      name: 'sections',
      templates: {
        header: header(options.translations.sections),
        suggestion: (hit) => {
          hit.nb_articles_text = `${hit.nb_articles} ${articleLocale(hit.nb_articles)}`;
          hit.colors = options.colors;
          return templates.autocomplete.section.render(hit);
        }
      }
    });
  }
  if (options.autocomplete.articles.enabled) {
    sources.push({
      source: adapter(articles, {hitsPerPage: (options.autocomplete.hits || 5)}),
      name: 'articles',
      templates: {
        header: header(options.translations.articles),
        suggestion: (hit) => {
          hit.colors = options.colors;
          return templates.autocomplete.article.render(hit);
        }
      }
    });
  }

  // autocomplete.js initialization
  console.log('hey');
  $query
    .attr('placeholder', options.translations.placeholder_autocomplete)
    .autocomplete({
      hint: false,
      debug: true,
      templates: {
        footer: (
          `<div class="ais-search-box--powered-by">
            ${options.translations.search_by}
            <a
              href="https://www.algolia.com/?utm_source=zendesk_hc&utm_medium=link&utm_campaign=autocomplete"
              class="ais-search-box--powered-by-link"
            >
              Algolia
            </a>
          </div>`
        )
      }
    }, sources)
    .on('autocomplete:selected', (event, suggestion, dataset) => {
      if (dataset === 'sections' || dataset === 'articles') {
        location.href = `${options.baseUrl}${I18n.locale}/${dataset}/${suggestion.id}`;
      } else if (dataset === 'other') {
        location.href = `${options.baseUrl}${I18n.locale}/search?query=${suggestion.query}`;
      }
    });
};
