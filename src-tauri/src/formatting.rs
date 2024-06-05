use lazy_static::lazy_static;
use regex::Regex;
use scraper::Html;

/*
    There should be no leading whitespace, period. The only trailing whitespace allowed is a 
    single newline, no spaces can be trailing. No extraneous whitespace should be allowed, 
    such as tabs, short tabs, and any of those strange old unicode whitespaces used. There 
    should be no more than one space or newline (the only whitespace allowed at this point) 
    in a row with no other characters in between. Any space/newline combination unseparated by 
    visible characters should be replaced by a single newline. All carriage returns should be 
    replaced with a newline character.
*/

lazy_static! {
    static ref HEAD_TAG: Regex = Regex::new(r"<head>[\s\S]*?<\/head>").unwrap();
    static ref INVISIBLE_CHARS: Regex = Regex::new(r"[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\xA0\x{2000}-\x{200F}\x{2028}-\x{202F}\x{205F}-\x{206F}]").unwrap();
    static ref CARRIAGE_RETURN: Regex = Regex::new(r"\r").unwrap();
    static ref LEADING_WHITESPACE: Regex = Regex::new(r"^\s+").unwrap();
    static ref TRAILING_WHITESPACE: Regex = Regex::new("[ ]+$").unwrap();
    static ref MULTI_SPACE: Regex = Regex::new(r" {2,}").unwrap();
    static ref SPACE_NEWLINE: Regex = Regex::new(r" +\n+").unwrap();
    static ref NEWLINE_SPACE: Regex = Regex::new(r"\n+ +").unwrap();
    static ref MULTI_NEWLINE: Regex = Regex::new(r"\n{2,}").unwrap();
}

pub fn format_text(text: &str) -> String {
    let mut new_text = INVISIBLE_CHARS.replace_all(text, " ").to_string();
    new_text = CARRIAGE_RETURN.replace_all(&new_text, "\n").to_string();
    new_text = LEADING_WHITESPACE.replace_all(&new_text, "").to_string();
    new_text = TRAILING_WHITESPACE.replace_all(&new_text, "").to_string();
    new_text = MULTI_SPACE.replace_all(&new_text, " ").to_string();
    new_text = SPACE_NEWLINE.replace_all(&new_text, "\n").to_string();
    new_text = NEWLINE_SPACE.replace_all(&new_text, "\n").to_string();
    new_text = MULTI_NEWLINE.replace_all(&new_text, "\n").to_string();

    new_text.to_string()
}


// todo: better html parsing. check styles for display:none, etc.
pub fn parse_html(html: &str) -> String {
    let new_html = HEAD_TAG.replace_all(html, "").to_string();
    Html::parse_document(&new_html).root_element().text().collect()
}