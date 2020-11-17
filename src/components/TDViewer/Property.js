/********************************************************************************
 * Copyright (c) 2018 - 2020 Contributors to the Eclipse Foundation
 * 
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * 
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/
import React from "react";
import "../../assets/main.css"
import { buildAttributeListObject, separateForms } from "../../util.js"
import Form from "./Form";

const alreadyRenderedKeys = ["title", "forms", "description"];

export default function Property(props) {
    if ((Object.keys(props.prop).length === 0 && props.prop.constructor !== Object)) {
        return <div className="text-3xl text-white">Property could not be rendered because mandatory fields are missing.</div>
    }

    const property = props.prop;
    const forms = separateForms(props.prop.forms);

    const attributeListObject = buildAttributeListObject({ name: props.propName }, props.prop, alreadyRenderedKeys);
    const attributes = Object.keys(attributeListObject).map(x => {
        return <li key={x}>{x} : {JSON.stringify(attributeListObject[x])}</li>
    });

    return (
        <>
            <details>
                <summary className="text-xl text-gray-400 ">{property.title ?? props.propName}</summary>
                <div className="mb-4">
                    <div className="text-lg text-gray-400 pb-2">{property.description}</div>
                    <ul className="list-disc text-base text-gray-300 pl-8">{attributes}</ul>
                    {forms.map((form, i) => (
                        <Form key={i} form={form} interactionType={"property"} className="last:pb-4"></Form>
                    ))}
                </div>
            </details>
        </>
    )
}