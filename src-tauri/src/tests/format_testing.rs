#[cfg(test)]
mod tests {
    use crate::formatting::{format_text, parse_html};

    #[test]
    fn test_no_change() {
        let text = "Hello, world!";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, world!");
    }

    #[test]
    fn test_invisible_chars() {
        let text = "Hello,\t\r\0World";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello,\nWorld");
    }

    #[test]
    fn test_leading_whitespace() {
        let text = "  \n\n Hello, world!  \n  \n\n";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, world!\n");
    }

    #[test]
    fn test_multiple_spaces() {
        let text = "Hello,  World!";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, World!");
    }

    #[test]
    fn test_multiple_newlines() {
        let text = "Hello,\n\nWorld!";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello,\nWorld!");
    }

    #[test]
    fn test_space_newline() {
        let text = "Hello, \nWorld!";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello,\nWorld!");
    }

    #[test]
    fn copilots_test1() {
        let text = "\t\tHello, World\t\t";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, World");
    }

    #[test]
    fn copilots_test2() {
        let text = "\n\nHello\n\nWorld\n\n";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello\nWorld\n");
    }

    #[test]
    fn copilots_test3() {
        let text = "Hello  World";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello World");
    }

    #[test]
    fn copilots_test4() {
        let text = "Hello\r\nWorld";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello\nWorld");
    }

    #[test]
    fn copilots_test5() {
        let text = "  Hello\n\n\nWorld  ";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello\nWorld");
    }

    #[test]
    fn copilots_test6() {
        let text = "Hello  \n  World";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello\nWorld");
    }

    #[test]
    fn copilots_test7() {
        let text = "Hello\t\tWorld";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello World");
    }

    #[test]
    fn copilots_test8() {
        let text = "Hello\rWorld";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello\nWorld");
    }

    #[test]
    fn copilots_test9() {
        let text = "Hello World\r\n";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello World\n");
    }

    #[test]
    fn test_em_space() {
        let text = "Hello, \u{2003}World!";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, World!");
    }

    #[test]
    fn test_awful_string1() {
        let text = "  \n\n Hello,\t\r\0World  \n  \n\n";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello,\nWorld\n");
    }

    #[test]
    fn generated_test1() {
        let text = " \0  \n\0Hello, \0\t   World  \0\r";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello, World\n");
    }

    #[test]
    fn generated_test2() {
        let text = " \n\u{0001}Hello,\u{0000}  \r\r\n\u{0000}\u{0000} \u{0002} World\n\u{0001}\u{0000}  \u{0000}\u{0002}";
        let formatted_text = format_text(text);
        assert_eq!(formatted_text, "Hello,\nWorld\n");
    }

    #[test]
    fn test_head_tag() {
        let html = "<head>
                        <title>copytype!</title>
                        <style>
                            body {
                                    background-color: #000000;
                                    color: #ffffff;
                                }
                        </style>
                    </head>
                    <p>
                        Hello, World!
                    </p>";
        let text = parse_html(html);
        let formatted_text = format_text(&text);
        assert_eq!(formatted_text, "Hello, World!\n");
    }
}

