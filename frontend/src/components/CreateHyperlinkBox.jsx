import React from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const createCollapseBox = (items) => {
  // data passed in here will be valid by default since it was redirected
  if (!items || items.length === 0) return "N/A";

  const [first, ...rest] = items;

  return (
    <div className="flex gap-2 flex-wrap">
      <a className="bg-gray-200 px-4 py-1.5 rounded-md text-xs flex items-center text-black shadow-sm cursor-default">
        {first}
      </a>

      {rest.length > 0 && (
        <Disclosure>
          {({ open }) => (
            <div className="relative">
              <DisclosureButton className="flex justify-between items-center bg-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700 rounded-md shadow-sm hover:bg-gray-300">
                More
                <ChevronDownIcon
                  className={`h-4 w-4 transform transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </DisclosureButton>

              <DisclosurePanel className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto w-60">
                <ul className="divide-y divide-gray-100">
                  {rest.map((item, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </DisclosurePanel>
            </div>
          )}
        </Disclosure>
      )}
    </div>
  );
};

const createHyperlinkBox = (inputLinks, type) => {
  let linksArray = [];

  if (!inputLinks) {
    return "N/A";
  }

  if (Array.isArray(inputLinks) && type === "website") {
    linksArray = inputLinks.map((link) => {
      try {
        const url = new URL(link);
        let label;

        if (url.pathname.endsWith(".pdf")) {
          label = url.pathname.split("/").pop();
        } else {
          label = url.hostname.replace(/^www\./, "");
        }

        return [label, link];
      } catch {
        return ["website", link];
      }
    });
  } else if (Array.isArray(inputLinks) && type === "categories") {
    return createCollapseBox(inputLinks);
  } else if (typeof inputLinks === "object" && inputLinks !== null) {
    linksArray = Object.entries(inputLinks);
  }

  // filter out empty and generic links
  const availableLinks = linksArray.filter(([, link]) => {
    return link && !link.endsWith(".com");
  });

  const hyperlinkBoxes = availableLinks.map(([key, link]) => {
    let label;

    if (type === "community") {
      // capitalize for formality
      label = key.charAt(0).toUpperCase() + key.slice(1);
    } else {
      label = key;
    }

    return (
      <a
        key={key}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gray-200 px-4 py-1.5 rounded-md text-xs text-black inline-block shadow-sm hover:bg-gray-300"
      >
        {label}
      </a>
    );
  });

  return <div className="flex gap-2 flex-wrap">{hyperlinkBoxes}</div>;
};

export default createHyperlinkBox;

// disclosure created with https://headlessui.com/react/disclosure
