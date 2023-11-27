export default [
  {
    pattern: "https://api.mailjet.com/v3.1/send",

    fixtures: () => {
      return {
        output: {
          status: 1,
          result: "some text here"
        }
      };
    },

    post: (_, data) => {
      return {
        body: data
      };
    },

    get: (_, data) => {
      return {
        body: data
      };
    }
  }
];
