#![cfg(test)]

use crate::features::resourcelists::ResourceList;

#[test]
fn test_resource_list_append_1() {
    let mut list = ResourceList::new(&["A.ba2", "B.ba2", "C.ba2"]);
    list.append(vec!["B.ba2".to_string(), "D.ba2".to_string()].into_iter());
    assert_eq!(list.resources, &["A.ba2", "B.ba2", "C.ba2", "D.ba2"]);
}

#[test]
fn test_resource_list_append_2() {
    let mut list = ResourceList::new(&["A.ba2", "B.ba2", "C.ba2"]);
    list.append(
        vec![
            "B.ba2".to_string(),
            "D.ba2".to_string(),
            "B.ba2".to_string(),
        ]
        .into_iter(),
    );
    assert_eq!(list.resources, &["A.ba2", "B.ba2", "C.ba2", "D.ba2"]);
}

#[test]
fn test_resource_list_prepend_1() {
    let mut list = ResourceList::new(&["B.ba2", "C.ba2", "D.ba2"]);
    list.prepend(vec!["A.ba2".to_string(), "B.ba2".to_string()].into_iter());
    assert_eq!(list.resources, &["A.ba2", "B.ba2", "C.ba2", "D.ba2"]);
}

#[test]
fn test_resource_list_prepend_2() {
    let mut list = ResourceList::new(&["A.ba2", "B.ba2", "C.ba2", "D.ba2"]);
    list.prepend(vec!["B.ba2".to_string(), "C.ba2".to_string()].into_iter());
    assert_eq!(list.resources, &["B.ba2", "C.ba2", "A.ba2", "D.ba2"]);
}

#[test]
fn test_resource_list_prepend_3() {
    let mut list = ResourceList::new(&["A.ba2", "B.ba2", "C.ba2"]);
    list.prepend(
        vec![
            "B.ba2".to_string(),
            "C.ba2".to_string(),
            "B.ba2".to_string(),
        ]
        .into_iter(),
    );
    assert_eq!(list.resources, &["B.ba2", "C.ba2", "A.ba2"]);
}

#[test]
fn test_resource_list_remove_many_1() {
    let mut list = ResourceList::new(&["A.ba2", "B.ba2", "C.ba2", "D.ba2"]);
    list.remove_many(&["B.ba2".to_string(), "C.ba2".to_string()]);
    assert_eq!(list.resources, &["A.ba2", "D.ba2"]);
}
