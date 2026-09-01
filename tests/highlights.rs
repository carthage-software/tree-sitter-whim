#[test]
fn highlights_query_is_valid() {
    let language = tree_sitter_whim::LANGUAGE.into();
    tree_sitter::Query::new(&language, tree_sitter_whim::HIGHLIGHTS_QUERY)
        .expect("the highlights query should be valid");
}
