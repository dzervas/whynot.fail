import React, { Component } from "react";
import { HashLink as Link } from "react-router-hash-link";

export default class Nav extends Component {
	render() {
		var items = [];

		for (const [index, value] of this.props.nav_items.entries()) {
			var sub_items = [];
			var sub = null;
			if ("sub" in value) {
				for (const [subindex, subvalue] of value.sub.entries()) {
					sub_items.push(
						<li key={subindex} className="menu-item menu-item-type-post_type menu-item-object-page">
							<Link to={subvalue.url}>{ subvalue.name }</Link>
						</li>
					)
				}

				sub = (
					<ul className="sub-menu">
						{sub_items}
					</ul>
				);
			}

			items.push(
				<li key={index} className="menu-item menu-item-type-post_type menu-item-object-page">
					<Link to={value.url}>{value.name}</Link>
					{sub}
				</li>
			)
		}

		return (
			<ul className="menu-primary-items">
				{items}
				<li className="menu-item-type-post_type menu-item-object-page">
					<input id="search-input" type="search" placeholder="Search" />
					<ul className="sub-menu" id="search-results">

					</ul>

					<template id="search-result-template">
						<li className="menu-item menu-item-type-post_type menu-item-object-page">
							<a className="summary-title-link"></a>
							<p className="summary"></p>
							<b>Tags:&nbsp;</b><i className='tags'></i>
						</li>
					</template>
				</li>
			</ul>
		)
	}
}
