trame-iframe
===========================================================

Trame widget library that can be use to handle cross-origin communication with iframe.
This library is compatible with both vue2 and vue3 client.

In a nutshell, this library allow to embed a trame application as an iframe while still enabling communication or synchronization with the parent web application.
This also could be reversed where trame can embed an external web application as iframe and either drive it or listen to internal state change.

For more details on how to use it, please look at the examples.


License
-----------------------------------------------------------

This library is distributed under the Apache Software License


Development
-----------------------------------------------------------

Build and install the Vue components

.. code-block:: console

    cd vue-components
    npm i
    npm run build
    cd -

Install python package

.. code-block:: console

    pip install -e .
