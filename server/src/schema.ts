import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type AsteroidEntity {
    id: ID!
    name: String!
    absolute_magnitude_h: Float
    estimated_diameter_min_km: Float
    estimated_diameter_max_km: Float
    is_potentially_hazardous_asteroid: Boolean
    close_approach_date: String
    relative_velocity_km_per_s: String
    miss_distance_km: String
  }

  type SkyboxTexture {
    url: String!
    title: String!
    explanation: String!
    date: String!
  }

  type Query {
    getNearEarthObjects(startDate: String!, endDate: String!): [AsteroidEntity]!
    getAstronomyPictureOfTheDay(date: String): SkyboxTexture
  }
`;
