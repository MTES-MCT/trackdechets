import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import DropdownMenu from "./DropdownMenu";

const links = [
  {
    route: "/dashboard/create/some-route",
    title: "Some route"
  },
  {
    route: "/dashboard/create/some-other-route",
    title: "Some other route"
  }
];

describe("DropdownMenu", () => {
  it("renders the component", () => {
    const { getByText } = render(
      <DropdownMenu menuTitle="title" links={links} />,
      { wrapper: BrowserRouter }
    );

    const createBtn = getByText("title");
    expect(createBtn).toBeInTheDocument();
  });

  it("displays the dropdown content when the menu button is clicked", () => {
    const { getByText } = render(
      <DropdownMenu menuTitle="title" links={links} />,
      {
        wrapper: BrowserRouter
      }
    );

    const createBtn = getByText("title");
    fireEvent.click(createBtn);

    links.forEach(({ title }) => {
      expect(getByText(title)).toBeInTheDocument();
    });
  });

  it("closes the dropdown when the menu button is clicked again", () => {
    const { getByText, queryByText } = render(
      <DropdownMenu menuTitle="title" links={links} />,
      { wrapper: BrowserRouter }
    );

    const createBtn = getByText("title");
    fireEvent.click(createBtn);
    fireEvent.click(createBtn);

    links.forEach(({ title }) => {
      expect(queryByText(title)).not.toBeInTheDocument();
    });
  });
});
